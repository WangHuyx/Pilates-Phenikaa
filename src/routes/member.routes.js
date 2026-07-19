const express = require('express');
const router = express.Router();
const MemberController = require('../controllers/member.controller'); // Đảm bảo khớp với tên file controller của nhóm
const Auth = require('../middlewares/authMiddleware');

// ==========================================
// RÀO CHẮN BẢO VỆ TOÀN CỤC (GLOBAL ROUTE GUARD)
// ==========================================
// Dòng lệnh dưới đây bắt buộc người dùng phải đăng nhập và có vai trò 'member' mới có thể đi tiếp.
router.use(Auth.role('member'));

// ==========================================
// 1. TRANG CHỦ / DASHBOARD CỦA HỘI VIÊN
// ==========================================
// R0.5: Dashboard tóm tắt thông tin gói tập hiện tại và thông báo từ hệ thống
router.get('/dashboard', MemberController.showDashboard);

// ==========================================
// 2. PHÂN HỆ QUẢN LÝ GÓI TẬP (PACKAGES)
// ==========================================
// R2.3: Xem danh sách các gói tháng/vé ngày hiện có của phòng tập
router.get('/packages', MemberController.showPackages);

// R2.3 & R2.6: Đăng ký mua gói tháng trực tuyến (tạo hóa đơn tạm tính ở trạng thái 'pending')
router.post('/packages/register', MemberController.registerPackage);

// R2.5: Gửi yêu cầu báo hủy gói tập tháng (chuyển trạng thái gói sang 'pending_cancel' chờ Admin duyệt)
router.post('/packages/cancel', MemberController.cancelPackage);

// ==========================================
// 3. PHÂN HỆ ĐẶT LỊCH LỚP HỌC (CLASSES & BOOKINGS)
// ==========================================
// R5.6: Xem lịch phòng tập trực quan theo tuần
router.get('/classes', MemberController.showClasses);

// R5.3: Thực hiện đặt chỗ/đăng ký ca tập ngày
// (Logic Backend kiểm tra thẻ VIP 'active', chặn giới hạn daily_limit, hoặc yêu cầu thanh toán vé ngày)
router.post('/classes/book', MemberController.bookClass);

// R1.5: Tra cứu lịch sử các ca tập đã đặt và trạng thái đi tập cá nhân
router.get('/my-bookings', MemberController.showMyBookings);

// R1.5: Hội viên chủ động hủy đặt chỗ trước khi ca tập diễn ra
router.post('/bookings/cancel', MemberController.cancelBooking);

module.exports = router;