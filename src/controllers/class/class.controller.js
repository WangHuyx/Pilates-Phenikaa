/**
 * class.controller.js
 * ------------------------------------------------------------------
 * CONTROLLER LAYER for the Pilates-class-facing pages: dashboard,
 * class catalog, booking action, and "my bookings".
 * ------------------------------------------------------------------
 */
const classService = require('../../services/class.service');
const classRepo = require('../../repositories/class/class.repository'); // Cho các thao tác đơn giản không cần logic
const paymentRepo = require('../../repositories/payment.repository');
const packageRepo = require('../../repositories/package/package.repository');

/** GET /dashboard */
async function showDashboard(req, res, next) {
  try {
    const user = req.session.user;
    const stats = await classService.getDashboardStats(user.id);
    const classes = await classRepo.findAllClasses();
    res.render('dashboard', { title: 'Tổng quan', user, stats, classes });
  } catch (err) { next(err); }
}

/** GET /classes */
async function showClasses(req, res, next) {
  try {
    const userId = req.session.user.id;
    const classes = await classService.getClassesForDisplay(userId);
    const activeSub = await packageRepo.findActiveSubscription(userId);

    const message = req.session.flash_success || req.session.flash_error || null;
    delete req.session.flash_success; delete req.session.flash_error;

    res.render('class/classes', { title: 'Lịch học', user: req.session.user, classes, message, hasActiveVip: !!activeSub });
  } catch (err) { next(err); }
}

/** POST /classes/:id/register */
async function registerClass(req, res, next) {
  try {
    const result = await classService.registerForClass(req.params.id, req.session.user.id);
    if (result.success) {
      req.session.flash_success = result.message;
    } else {
      req.session.flash_error = result.message;
    }
    res.redirect('/classes');
  } catch (err) { next(err); }
}

/** GET /my-bookings */
async function showMyBookings(req, res, next) {
  try {
    const myClasses = await classRepo.findBookingsByUserId(req.session.user.id);
    const success = req.session.flash_success; delete req.session.flash_success;
    const error = req.session.flash_error; delete req.session.flash_error;
    res.render('booking/my-bookings', { title: 'Lớp đã đặt', user: req.session.user, myClasses, success, error });
  } catch (err) { next(err); }
}

/** POST /classes/:id/cancel */
async function cancelBooking(req, res, next) {
  try {
    await classService.cancelBooking(req.params.id, req.session.user.id);
    req.session.flash_success = 'Đã hủy đặt chỗ thành công.';
    res.redirect('/my-bookings');
  } catch (err) { next(err); }
}

/** --- LUỒNG ADMIN: KIỂM DUYỆT --- */
async function showApprovals(req, res, next) {
  try {
    const pendingEnrollments = await classRepo.findPendingEnrollments();
    const success = req.session.flash_success; delete req.session.flash_success;
    const error = req.session.flash_error; delete req.session.flash_error;
    res.render('admin/admin-approvals', { title: 'Kiểm duyệt đặt chỗ', user: req.session.user, pendingEnrollments, success, error });
  } catch (err) { next(err); }
}

async function approveEnrollment(req, res, next) {
  try {
    await classRepo.approveEnrollment(req.params.id, req.session.user.id);
    // Vé lượt đã thu (nếu có) coi như xác nhận thu tiền thành công khi admin duyệt
    await paymentRepo.markStatusByEnrollmentId(req.params.id, 'paid');
    req.session.flash_success = 'Đã duyệt yêu cầu đặt chỗ.';
    res.redirect('/classes/approvals');
  } catch (err) { next(err); }
}

async function rejectEnrollment(req, res, next) {
  try {
    await classRepo.rejectEnrollment(req.params.id, req.session.user.id, req.body.admin_note);
    // Từ chối đặt chỗ -> hủy luôn giao dịch vé lượt liên quan (nếu có)
    await paymentRepo.markStatusByEnrollmentId(req.params.id, 'cancelled');
    req.session.flash_success = 'Đã từ chối yêu cầu đặt chỗ.';
    res.redirect('/classes/approvals');
  } catch (err) { next(err); }
}

/** --- LUỒNG ADMIN: CRUD LỚP HỌC --- */
async function manageClasses(req, res, next) {
  try {
    const classes = await classService.getClassesForManage();
    const success = req.session.flash_success; delete req.session.flash_success;
    const error = req.session.flash_error; delete req.session.flash_error;
    res.render('class/classes-manage', { title: 'Quản lý lớp học', user: req.session.user, classes, success, error });
  } catch (err) { next(err); }
}

async function createClass(req, res, next) {
  try {
    if (!req.body.name || !req.body.day || !req.body.time) {
      req.session.flash_error = 'Vui lòng điền đầy đủ thông tin bắt buộc.';
      return res.redirect('/classes/manage');
    }
    await classRepo.createClass(req.body);
    req.session.flash_success = `Đã tạo lớp "${req.body.name}".`;
    res.redirect('/classes/manage');
  } catch (err) { next(err); }
}

async function showEditClass(req, res, next) {
  try {
    const cls = await classRepo.findClassById(req.params.id);
    if (!cls) { req.session.flash_error = 'Không tìm thấy lớp.'; return res.redirect('/classes/manage'); }
    res.render('class/classes-edit', { title: 'Sửa lớp học', user: req.session.user, cls, error: null });
  } catch (err) { next(err); }
}

async function updateClass(req, res, next) {
  try {
    await classRepo.updateClass(req.params.id, req.body);
    req.session.flash_success = 'Cập nhật lớp học thành công.';
    res.redirect('/classes/manage');
  } catch (err) { next(err); }
}

async function deleteClass(req, res, next) {
  try {
    await classRepo.softDeleteClass(req.params.id);
    req.session.flash_success = 'Đã ngừng hoạt động lớp học.';
    res.redirect('/classes/manage');
  } catch (err) { next(err); }
}

module.exports = { 
  showDashboard, showClasses, registerClass, showMyBookings, cancelBooking,
  showApprovals, approveEnrollment, rejectEnrollment,
  manageClasses, createClass, showEditClass, updateClass, deleteClass
};