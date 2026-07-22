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

/** GET /register — hiển thị biểu mẫu tự đăng ký tài khoản hội viên */
function showRegisterForm(req, res) {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('register', { title: 'Đăng ký', error: null, old: {} });
}

/** POST /register — tạo tài khoản hội viên (role luôn là 'member') và tự đăng nhập */
async function handleRegister(req, res, next) {
  try {
    const { username, fullName, email, phone, password, confirmPassword } = req.body;
    const result = await authService.register({ username, fullName, email, phone, password, confirmPassword });

    if (!result.success) {
      return res.status(400).render('register', { title: 'Đăng ký', error: result.message, old: req.body });
    }

    req.session.user = result.user;
    res.redirect('/dashboard');
  } catch (err) {
    next(err);
  }
}

module.exports = { showLoginForm, handleLogin, handleLogout, showRegisterForm, handleRegister };
