// middleware/admin.middleware.js
// Chỉ cho phép Admin truy cập

function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  res.status(403).render('error', {
    title: 'Không có quyền',
    message: 'Bạn không có quyền truy cập trang này. Chỉ Admin mới được phép.',
    currentUser: req.session ? req.session.user : null,
  });
}

module.exports = { requireAdmin };