const AccountService = require('../services/account.service');
const pool = require('../config/database');

const AccountController = {

  async index(req, res, next) {
    try {
      const users   = await AccountService.getAllUsers();
      const success = req.session.flash_success || null;
      const error   = req.session.flash_error   || null;
      delete req.session.flash_success;
      delete req.session.flash_error;
      res.render('accounts', {
        title: 'Quản lý tài khoản',
        accounts: users,
        roles: AccountService.validRoles,
        success,
        error,
        currentUser: req.session.user,
        user: req.session.user,
      });
    } catch (err) {
      next(err);
    }
  },

  async showEdit(req, res, next) {
    try {
      const editUser = await AccountService.getUserById(req.params.id);
      if (!editUser) {
        req.session.flash_error = 'Không tìm thấy tài khoản.';
        return res.redirect('/accounts');
      }
      res.render('accounts-edit', {
        title: 'Chỉnh sửa tài khoản',
        editUser,
        roles: AccountService.validRoles,
        error: null,
        currentUser: req.session.user,
        user: req.session.user,
      });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res) {
    const { username, fullName, email, password, role } = req.body;
    try {
      await AccountService.createUser({ username, fullName, email, password, role });
      req.session.flash_success = `Đã tạo tài khoản "${username}" thành công.`;
    } catch (err) {
      req.session.flash_error = err.message;
    }
    res.redirect('/accounts');
  },

  async update(req, res) {
    const { fullName, email, role, password } = req.body;
    try {
      await AccountService.updateUser(req.params.id, { fullName, email, role, password });
      req.session.flash_success = 'Cập nhật tài khoản thành công.';
    } catch (err) {
      req.session.flash_error = err.message;
    }
    res.redirect('/accounts');
  },

  async delete(req, res) {
    try {
      await AccountService.deleteUser(req.params.id, req.session.user.id);
      req.session.flash_success = 'Đã xóa tài khoản thành công.';
    } catch (err) {
      req.session.flash_error = err.message;
    }
    res.redirect('/accounts');
  },

  async changeRole(req, res) {
    const { role } = req.body;
    try {
      await AccountService.changeRole(req.params.id, role);
      req.session.flash_success = 'Đã cập nhật vai trò thành công.';
    } catch (err) {
      req.session.flash_error = err.message;
    }
    res.redirect('/accounts');
  },

  async history(req, res, next) {
    try {
      const { id } = req.params;
      const member = await AccountService.getUserById(id);
      if (!member) { req.session.flash_error = 'Không tìm thấy tài khoản.'; return res.redirect('/accounts'); }

      const [[checkinStats]] = await pool.query(
        'SELECT COUNT(*) AS total FROM checkins WHERE user_id=?', [id]
      );
      const [checkins] = await pool.query(
        `SELECT c.*, DATE(c.check_in_time) AS day,
          TIMESTAMPDIFF(MINUTE, c.check_in_time, IFNULL(c.check_out_time, NOW())) AS duration_min
         FROM checkins c WHERE c.user_id=? ORDER BY c.check_in_time DESC LIMIT 50`, [id]
      );
      const [bookings] = await pool.query(
        `SELECT sc.name, sc.instructor, sc.day, sc.time, sc.level
         FROM simple_class_enrollments e
         JOIN simple_classes sc ON e.class_id = sc.id
         WHERE e.user_id=? ORDER BY sc.day, sc.time`, [id]
      );
      const [memberships] = await pool.query(
        `SELECT mm.*, mp.name AS package_name, mp.price, mp.duration_days
         FROM member_memberships mm
         JOIN membership_packages mp ON mm.package_id = mp.id
         WHERE mm.user_id=? ORDER BY mm.created_at DESC`, [id]
      );
      const [payments] = await pool.query(
        `SELECT * FROM payments WHERE user_id=? ORDER BY payment_date DESC LIMIT 20`, [id]
      );

      res.render('member-history', {
        title: `Lịch sử — ${member.fullName}`,
        user: req.session.user, member,
        checkins, checkinStats,
        bookings, memberships, payments,
      });
    } catch (err) { next(err); }
  },
};

module.exports = AccountController;
