/**
 * auth.middleware.js
 * ------------------------------------------------------------------
* Route guard: chặn quyền truy cập vào các trang được bảo vệ (bảng điều khiển, lớp học,
* đặt chỗ) trừ khi có người dùng đã đăng nhập trong phiên làm việc.
 * ------------------------------------------------------------------
 */

function requireLogin(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  // Chưa đăng nhập -> chuyển hướng đến trang đăng nhập
  return res.redirect('/login');
}

module.exports = { requireLogin };
