const AccountService = require('../services/account.service');

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
};

module.exports = AccountController;
