function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  res.status(403).render('error', {
    title: 'Không có quyền',
    message: 'Bạn không có quyền truy cập trang này. Chỉ Quản trị viên mới được phép.',
    currentUser: req.session ? req.session.user : null,
  });
}

function requireAdminOrStaff(req, res, next) {
  const role = req.session && req.session.user && req.session.user.role;
  if (role === 'admin' || role === 'staff') return next();
  res.status(403).render('error', {
    title: 'Không có quyền',
    message: 'Bạn không có quyền truy cập trang này.',
    currentUser: req.session ? req.session.user : null,
  });
}

module.exports = { requireAdmin, requireAdminOrStaff };