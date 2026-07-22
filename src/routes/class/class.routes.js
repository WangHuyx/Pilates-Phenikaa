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

// --- Quản lý lớp học (Admin/Staff) ---
router.get('/classes/manage', Auth.role('admin', 'staff'), classController.manageClasses);
router.get('/classes/:id/edit', Auth.role('admin', 'staff'), classController.showEditClass);
router.post('/classes/create', Auth.role('admin', 'staff'), classController.createClass);
router.post('/classes/:id/update', Auth.role('admin', 'staff'), classController.updateClass);
router.post('/classes/:id/delete', Auth.role('admin', 'staff'), classController.deleteClass);

// --- Quản lý kiểm duyệt Đặt chỗ (Admin/Staff) ---
router.get('/classes/approvals', Auth.role('admin', 'staff'), classController.showApprovals);
router.post('/classes/enrollments/:id/approve', Auth.role('admin', 'staff'), classController.approveEnrollment);
router.post('/classes/enrollments/:id/reject', Auth.role('admin', 'staff'), classController.rejectEnrollment);

// --- Tương tác của Hội viên (Member) ---
router.post('/classes/:id/register', Auth.role('member'), classController.registerClass);
router.post('/classes/:id/cancel', Auth.role('member'), classController.cancelBooking);
router.get('/my-bookings', Auth.requiredlogin, classController.showMyBookings);

module.exports = router;
