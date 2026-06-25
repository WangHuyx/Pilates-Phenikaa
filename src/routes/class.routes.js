/**

* class.routes.js — bảng điều khiển, danh mục lớp học, đặt chỗ, các đặt chỗ của tôi.
 * Mọi tuyến đường (route) đều được gọi qua `requireLogin`,
 * do đó khách truy cập ẩn danh sẽ bị chuyển hướng đến /login thay vì xem được trang.
 */

const express = require('express');
const router = express.Router();
const classController = require('../controllers/class.controller');
const { requireLogin } = require('../middleware/auth.middleware');

router.get('/dashboard', requireLogin, classController.showDashboard);
router.get('/classes', requireLogin, classController.showClasses);
router.post('/classes/:id/register', requireLogin, classController.registerClass);
router.get('/my-bookings', requireLogin, classController.showMyBookings);

module.exports = router;
