/**

* class.routes.js — bảng điều khiển, danh mục lớp học, đặt chỗ, các đặt chỗ của tôi.
 * Mọi tuyến đường (route) đều được gọi qua `requireLogin`,
 * do đó khách truy cập ẩn danh sẽ bị chuyển hướng đến /login thay vì xem được trang.
 */

const express = require('express');
const router = express.Router();
const classController = require('../../controllers/class/class.controller');
const Auth = require('../../middleware/auth.middleware');

router.get('/dashboard', Auth.requiredlogin, classController.showDashboard);
router.get('/classes', Auth.requiredlogin, classController.showClasses);

// --- Quản lý lớp học: quyền do trang /permissions cấu hình thật (class.view/class.manage) ---
router.get('/classes/manage', Auth.permission('class.view'), classController.manageClasses);
router.get('/classes/:id/edit', Auth.permission('class.view'), classController.showEditClass);
router.post('/classes/create', Auth.permission('class.manage'), classController.createClass);
router.post('/classes/:id/update', Auth.permission('class.manage'), classController.updateClass);
router.post('/classes/:id/delete', Auth.permission('class.manage'), classController.deleteClass);

// --- Quản lý kiểm duyệt Đặt chỗ (Admin/Staff) ---
router.get('/classes/approvals', Auth.role('admin', 'staff'), classController.showApprovals);
router.post('/classes/enrollments/:id/approve', Auth.role('admin', 'staff'), classController.approveEnrollment);
router.post('/classes/enrollments/:id/reject', Auth.role('admin', 'staff'), classController.rejectEnrollment);

// --- Tương tác của Hội viên (Member) ---
router.post('/classes/:id/register', Auth.role('member'), classController.registerClass);
router.post('/classes/:id/cancel', Auth.role('member'), classController.cancelBooking);
router.get('/my-bookings', Auth.requiredlogin, classController.showMyBookings);

module.exports = router;
