const EmployeeService = require('../services/employee.service');

const EmployeeController = {

  async index(req, res, next) {
    try {
      const filterStatus = req.query.status || 'all';
      const [employees, all] = await Promise.all([
        EmployeeService.getAll(filterStatus === 'all' ? null : filterStatus),
        EmployeeService.getAll(),
      ]);
      const success = req.session.flash_success || null;
      const error   = req.session.flash_error   || null;
      delete req.session.flash_success;
      delete req.session.flash_error;
      res.render('employees', {
        title: 'Quản lý nhân viên',
        employees,
        total:         all.length,
        totalActive:   all.filter(e => e.status === 'active').length,
        totalInactive: all.filter(e => e.status !== 'active').length,
        filterStatus,
        constants: EmployeeService.constants,
        success,
        error,
        user: req.session.user,
      });
    } catch (err) { next(err); }
  },

  async showEdit(req, res, next) {
    try {
      const emp = await EmployeeService.getById(req.params.id);
      if (!emp) {
        req.session.flash_error = 'Không tìm thấy nhân viên.';
        return res.redirect('/employees');
      }
      res.render('employees-edit', {
        title: 'Cập nhật nhân viên',
        emp,
        constants: EmployeeService.constants,
        error: null,
        user: req.session.user,
      });
    } catch (err) { next(err); }
  },

  async create(req, res) {
    const { fullName, phone, email, position, department, startDate } = req.body;
    try {
      if (!fullName || !phone || !position) throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc.');
      await EmployeeService.create({ fullName, phone, email, position, department, startDate });
      req.session.flash_success = `Đã thêm nhân viên "${fullName}" thành công.`;
    } catch (err) {
      req.session.flash_error = err.message;
    }
    res.redirect('/employees');
  },

  async update(req, res) {
    const { fullName, phone, email, position, department, startDate, status } = req.body;
    try {
      await EmployeeService.update(req.params.id, { fullName, phone, email, position, department, startDate, status });
      req.session.flash_success = 'Cập nhật nhân viên thành công.';
    } catch (err) {
      req.session.flash_error = err.message;
    }
    res.redirect('/employees');
  },

  async delete(req, res) {
    try {
      await EmployeeService.remove(req.params.id);
      req.session.flash_success = 'Đã xóa nhân viên thành công.';
    } catch (err) {
      req.session.flash_error = err.message;
    }
    res.redirect('/employees');
  },

  async schedule(req, res, next) {
    try {
      const data = await EmployeeService.getSchedulePage(req.query.week);
      const success = req.session.flash_success || null;
      const error   = req.session.flash_error   || null;
      delete req.session.flash_success;
      delete req.session.flash_error;
      res.render('employees-schedule', {
        title: 'Phân ca làm việc',
        ...data,
        success,
        error,
        user: req.session.user,
      });
    } catch (err) { next(err); }
  },

  async assignShift(req, res) {
    const { employeeId, shiftId, date, note, week } = req.body;
    try {
      if (!employeeId || !shiftId || !date) throw new Error('Thiếu thông tin phân ca.');
      await EmployeeService.addShift({ employeeId, shiftId, date, note });
      req.session.flash_success = 'Đã phân ca thành công.';
    } catch (err) {
      req.session.flash_error = err.message;
    }
    res.redirect(`/employees/schedule${week ? '?week=' + week : ''}`);
  },

  async deleteShift(req, res) {
    const week = req.body.week || '';
    try {
      await EmployeeService.deleteShift(req.params.id);
    } catch (err) {
      req.session.flash_error = err.message;
    }
    res.redirect(`/employees/schedule${week ? '?week=' + week : ''}`);
  },
};

module.exports = EmployeeController;
