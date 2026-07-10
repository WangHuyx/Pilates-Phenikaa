/**
 * class.controller.js
 * ------------------------------------------------------------------
 * CONTROLLER LAYER for the Pilates-class-facing pages: dashboard,
 * class catalog, booking action, and "my bookings".
 * ------------------------------------------------------------------
 */

const classService = require('../services/class.service');
const pool = require('../config/database');

/** GET /dashboard */
async function showDashboard(req, res, next) {
  try {
    const user = req.session.user;
    const classes = await classService.listClasses();

    const [[memberRow]] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM users u
       JOIN roles r ON u.role_id = r.id WHERE r.name = 'member'`
    );
    const [[staffRow]] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM staffs WHERE status = 'active'`
    ).catch(() => [[{ cnt: 0 }]]);
    const [[myBookRow]] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM simple_class_enrollments WHERE user_id = ?`,
      [user.id]
    );

    res.render('dashboard', {
      title: 'Tổng quan',
      user,
      classes,
      stats: {
        totalMembers:   memberRow.cnt,
        totalEmployees: staffRow.cnt,
        totalClasses:   classes.length,
        myBookings:     myBookRow.cnt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** GET /classes */
async function showClasses(req, res, next) {
  try {
    const classes = await classService.listClasses();
    res.render('classes', {
      title: 'Class schedule',
      user: req.session.user,
      classes,
      message: null,
    });
  } catch (err) {
    next(err);
  }
}

/** POST /classes/:id/register */
async function registerClass(req, res, next) {
  try {
    const classId = req.params.id;
    const userId = req.session.user.id;

    const result = await classService.registerForClass(classId, userId);
    const classes = await classService.listClasses();

    res.render('classes', {
      title: 'Class schedule',
      user: req.session.user,
      classes,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
}

/** GET /my-bookings */
async function showMyBookings(req, res, next) {
  try {
    const userId = req.session.user.id;
    const myClasses = await classService.myClasses(userId);
    res.render('my-bookings', { title: 'My bookings', user: req.session.user, myClasses });
  } catch (err) {
    next(err);
  }
}

/** GET /classes/manage */
async function manageClasses(req, res, next) {
  try {
    const classes = await classService.listClasses();
    const [flashS, flashE] = [req.session.flash_success, req.session.flash_error];
    delete req.session.flash_success; delete req.session.flash_error;
    res.render('classes-manage', {
      title: 'Quản lý lớp học', user: req.session.user,
      classes, success: flashS || null, error: flashE || null,
    });
  } catch (err) { next(err); }
}

/** POST /classes/create */
async function createClass(req, res, next) {
  try {
    const { name, instructor, day, time, level, capacity } = req.body;
    if (!name || !instructor || !day || !time) {
      req.session.flash_error = 'Vui lòng điền đầy đủ thông tin bắt buộc.';
      return res.redirect('/classes/manage');
    }
    await pool.query(
      'INSERT INTO simple_classes (name, instructor, day, time, level, capacity) VALUES (?,?,?,?,?,?)',
      [name, instructor, day, time, level || 'All levels', parseInt(capacity) || 10]
    );
    req.session.flash_success = `Đã tạo lớp "${name}".`;
    res.redirect('/classes/manage');
  } catch (err) { next(err); }
}

/** GET /classes/:id/edit */
async function showEditClass(req, res, next) {
  try {
    const cls = await classService.getClassById(req.params.id);
    if (!cls) { req.session.flash_error = 'Không tìm thấy lớp.'; return res.redirect('/classes/manage'); }
    res.render('classes-edit', { title: 'Sửa lớp học', user: req.session.user, cls, error: null });
  } catch (err) { next(err); }
}

/** POST /classes/:id/update */
async function updateClass(req, res, next) {
  try {
    const { name, instructor, day, time, level, capacity } = req.body;
    await pool.query(
      'UPDATE simple_classes SET name=?, instructor=?, day=?, time=?, level=?, capacity=? WHERE id=?',
      [name, instructor, day, time, level || 'All levels', parseInt(capacity) || 10, req.params.id]
    );
    req.session.flash_success = 'Cập nhật lớp học thành công.';
    res.redirect('/classes/manage');
  } catch (err) { next(err); }
}

/** POST /classes/:id/delete */
async function deleteClass(req, res, next) {
  try {
    await pool.query('DELETE FROM simple_class_enrollments WHERE class_id=?', [req.params.id]);
    await pool.query('DELETE FROM simple_classes WHERE id=?', [req.params.id]);
    req.session.flash_success = 'Đã xóa lớp học.';
    res.redirect('/classes/manage');
  } catch (err) { next(err); }
}

/** POST /classes/:id/cancel-booking */
async function cancelBooking(req, res, next) {
  try {
    const userId = req.session.user.id;
    await pool.query('DELETE FROM simple_class_enrollments WHERE class_id=? AND user_id=?', [req.params.id, userId]);
    req.session.flash_success = 'Đã hủy đặt chỗ.';
    res.redirect('/my-bookings');
  } catch (err) { next(err); }
}

module.exports = { showDashboard, showClasses, registerClass, showMyBookings, manageClasses, createClass, showEditClass, updateClass, deleteClass, cancelBooking };
