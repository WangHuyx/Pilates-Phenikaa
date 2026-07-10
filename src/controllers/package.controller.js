const pkgRepo  = require('../repositories/package.repository');
const userRepo = require('../repositories/user.repository');

function flash(req, key, msg) { req.session[key] = msg; }
function popFlash(req) {
  const s = req.session.flash_success; delete req.session.flash_success;
  const e = req.session.flash_error;   delete req.session.flash_error;
  return { success: s || null, error: e || null };
}

async function index(req, res, next) {
  try {
    const [packages, memberships, users, activeCount] = await Promise.all([
      pkgRepo.findAllPackages(),
      pkgRepo.findAllMemberships(),
      userRepo.findAll(),
      pkgRepo.countActive(),
    ]);
    res.render('packages', {
      title: 'Gói tập', user: req.session.user,
      packages, memberships, members: users,
      activeCount, ...popFlash(req),
    });
  } catch (err) { next(err); }
}

async function createPackage(req, res, next) {
  try {
    const { name, category, price, duration_days, description, features } = req.body;
    if (!name || !price || !duration_days) {
      flash(req, 'flash_error', 'Vui lòng điền đầy đủ thông tin gói tập.');
      return res.redirect('/packages');
    }
    await pkgRepo.createPackage({ name, category, price, duration_days, description, features });
    flash(req, 'flash_success', `Đã thêm gói "${name}".`);
    res.redirect('/packages');
  } catch (err) { next(err); }
}

async function updatePackage(req, res, next) {
  try {
    const { name, category, price, duration_days, description, features } = req.body;
    if (!name || !price || !duration_days) {
      flash(req, 'flash_error', 'Vui lòng điền đầy đủ thông tin gói tập.');
      return res.redirect('/packages');
    }
    await pkgRepo.updatePackage(req.params.id, { name, category, price, duration_days, description, features });
    flash(req, 'flash_success', `Đã cập nhật gói "${name}".`);
    res.redirect('/packages');
  } catch (err) { next(err); }
}

async function deletePackage(req, res, next) {
  try {
    await pkgRepo.deletePackage(req.params.id);
    flash(req, 'flash_success', 'Đã xóa gói tập.');
    res.redirect('/packages');
  } catch (err) { next(err); }
}

async function assignPackage(req, res, next) {
  try {
    const { user_id, package_id, start_date, note } = req.body;
    const pkg = await pkgRepo.findPackageById(package_id);
    if (!pkg) { flash(req, 'flash_error', 'Không tìm thấy gói tập.'); return res.redirect('/packages'); }
    const end = new Date(start_date);
    end.setDate(end.getDate() + pkg.duration_days);
    const end_date = end.toISOString().split('T')[0];
    await pkgRepo.createMembership({ user_id: parseInt(user_id), package_id: parseInt(package_id), start_date, end_date, note });
    flash(req, 'flash_success', 'Đã gán gói tập cho hội viên. Ngày hết hạn: ' + end_date);
    res.redirect('/packages');
  } catch (err) { next(err); }
}

async function deleteMembership(req, res, next) {
  try {
    await pkgRepo.deleteMembership(req.params.id);
    flash(req, 'flash_success', 'Đã xóa đăng ký gói tập.');
    res.redirect('/packages');
  } catch (err) { next(err); }
}

module.exports = { index, createPackage, updatePackage, deletePackage, assignPackage, deleteMembership };
