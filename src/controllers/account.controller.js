const AccountService = require('../services/account.service');
const pool = require('../config/database');

const AccountController = {

  async index(req, res, next) {
    try {
      const isAdmin = req.session.user.role === 'admin';
      // Lễ tân (staff) chỉ được xem danh sách hội viên, không thấy tài khoản admin/staff/trainer khác
      const users   = await AccountService.getAllUsers(isAdmin ? {} : { role: 'member' });
      const success = req.session.flash_success || null;
      const error   = req.session.flash_error   || null;
      delete req.session.flash_success;
      delete req.session.flash_error;
      res.render('accounts', {
        title: isAdmin ? 'Quản lý tài khoản' : 'Quản lý hội viên',
        accounts: users,
        roles: AccountService.validRoles,
        isAdmin,
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
      // Staff chỉ được sửa hồ sơ của chính mình hoặc tài khoản hội viên —
      // không được đụng vào tài khoản admin/staff/trainer khác.
      const requester = req.session.user;
      const isSelf = Number(requester.id) === Number(editUser.id);
      if (requester.role !== 'admin' && !isSelf && editUser.role !== 'member') {
        req.session.flash_error = 'Bạn không có quyền chỉnh sửa tài khoản này.';
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
    const { username, fullName, email, password } = req.body;
    // Lễ tân (staff) chỉ được phép tạo tài khoản hội viên — bỏ qua role gửi lên từ form
    // để tránh việc staff tự tạo tài khoản admin/staff/trainer cho chính mình.
    const role = req.session.user.role === 'admin' ? req.body.role : 'member';
    try {
      await AccountService.createUser({ username, fullName, email, password, role });
      req.session.flash_success = `Đã tạo tài khoản "${username}" thành công.`;
    } catch (err) {
      req.session.flash_error = err.message;
    }
    res.redirect('/accounts');
  },

  async update(req, res) {
    const { fullName, email, password } = req.body;
    const requester = req.session.user;
    // Tương tự: staff không được phép đổi vai trò tài khoản qua form sửa.
    const role = requester.role === 'admin' ? req.body.role : undefined;
    try {
      if (requester.role !== 'admin' && Number(requester.id) !== Number(req.params.id)) {
        const target = await AccountService.getUserById(req.params.id);
        if (!target || target.role !== 'member') {
          throw new Error('Bạn không có quyền chỉnh sửa tài khoản này.');
        }
      }
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
      if (req.session.user.role !== 'admin' && member.role !== 'member') {
        req.session.flash_error = 'Bạn không có quyền xem lịch sử tài khoản này.';
        return res.redirect('/accounts');
      }

      const [bookings] = await pool.query(
        `SELECT sc.name, sc.instructor, sc.day, sc.time, sc.level
         FROM class_enrollments e
         JOIN classes sc ON e.class_id = sc.id
         WHERE e.user_id=? ORDER BY sc.day, sc.time`, [id]
      );
      const [memberships] = await pool.query(
        `SELECT us.*, mp.name AS package_name, mp.price, mp.duration_days,
                us.activated_at AS start_date, us.expired_at AS end_date
         FROM user_subscriptions us
         JOIN membership_packages mp ON us.package_id = mp.id
         WHERE us.user_id=? ORDER BY us.created_at DESC`, [id]
      );
      const [payments] = await pool.query(
        `SELECT * FROM payments WHERE user_id=? ORDER BY payment_date DESC LIMIT 20`, [id]
      );

      res.render('package/member-history', {
        title: `Lịch sử — ${member.fullName}`,
        user: req.session.user, member,
        bookings, memberships, payments,
      });
    } catch (err) { next(err); }
  },
};

module.exports = AccountController;
