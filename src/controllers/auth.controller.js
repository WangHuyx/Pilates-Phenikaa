/**
 * auth.controller.js
 * ------------------------------------------------------------------
 * Controller không chứa logic nghiệp vụ, chỉ xử lý việc điều phối yêu cầu/phản hồi.
 * ------------------------------------------------------------------
 */

//Đăng nhập
const authService = require('../services/auth.service');


/** GET /login — hiển thị biểu mẫu đăng nhập (hoặc bỏ qua nếu đã đăng nhập) */
function showLoginForm(req, res) {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('login', { title: 'Login', error: null });
}

/** POST /login — xác thực thông tin đăng nhập và bắt đầu phiên làm việc */
async function handleLogin(req, res, next) {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password);

    if (!result.success) {
      return res.status(401).render('login', { title: 'Login', error: result.message });
    }

    // Storing the (already password-stripped) user on the session
    // is what "remembers" the visitor across requests.
    req.session.user = result.user;
    if (req.body.remember === 'on') {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 ngày
    }
    res.redirect('/dashboard');
  } catch (err) {
    next(err);
  }
}

/** GET /logout — hủy phiên làm việc và chuyển hướng người truy cập về /login */
function handleLogout(req, res, next) {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.redirect('/login');
  });
}

module.exports = { showLoginForm, handleLogin, handleLogout };
