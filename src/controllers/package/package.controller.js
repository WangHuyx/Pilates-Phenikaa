const pkgRepo  = require('../../repositories/package/package.repository');
const userRepo = require('../../repositories/user.repository');

function flash(req, key, msg) { req.session[key] = msg; }
function popFlash(req) {
  const s = req.session.flash_success; delete req.session.flash_success;
  const e = req.session.flash_error;   delete req.session.flash_error;
  return { success: s || null, error: e || null };
}

// Sửa lại hàm index để tách luồng Admin và Member
async function index(req, res, next) {
  try {
    const userRole = req.session.user.role; // Giả sử bạn lưu role trong session

    if (userRole === 'admin') {
      // Luồng của Admin: Lấy tất cả gói, thành viên, và lịch sử đăng ký
      const [packages, memberships, users, activeCount] = await Promise.all([
        pkgRepo.findAllPackages(),
        pkgRepo.findAllMemberships(),
        userRepo.findAll(),
        pkgRepo.countActive(),
      ]);
      res.render('package/packages', { // Render file packages.ejs (Của Admin)
        title: 'Quản lý Gói tập', user: req.session.user,
        packages, memberships, members: users,
        activeCount, ...popFlash(req),
      });
    } else {
      // Luồng của Member: Bổ sung lấy myMemberships
      const userId = req.session.user.id;
      const [allPackages, myMemberships] = await Promise.all([
        pkgRepo.findAllPackages(),
        pkgRepo.findMembershipsByUserId(userId)
      ]);
      
      const activePackages = allPackages.filter(p => p.is_active === 1);
      
      res.render('package/member-packages', { 
        title: 'Gói tập của tôi', user: req.session.user,
        packages: activePackages,
        myMemberships, // Truyền dữ liệu ra View
        ...popFlash(req),
      });
    }
  } catch (err) { next(err); }
}
// Thêm hàm buyPackage vào controller
async function buyPackage(req, res, next) {
  try {
    const user_id = req.session.user.id; // Lấy ID của member đang đăng nhập
    const { package_id } = req.body;
    
    // 1. Kiểm tra gói tập có tồn tại và đang hoạt động không
    const pkg = await pkgRepo.findPackageById(package_id);
    if (!pkg || pkg.is_active === 0) { 
      flash(req, 'flash_error', 'Gói tập không tồn tại hoặc đã ngừng cung cấp.'); 
      return res.redirect('/packages'); 
    }

    // 2. Ghi vào bảng user_subscriptions (Mặc định đã thanh toán)
    await pkgRepo.createMembership({ 
      user_id: parseInt(user_id), 
      package_id: parseInt(package_id), 
      price_paid: pkg.price, 
      duration_days: pkg.duration_days
    });
    
    flash(req, 'flash_success', `Đăng ký thành công gói "${pkg.name}". Cảm ơn bạn!`);
    res.redirect('/packages');
  } catch (err) { next(err); }
}
async function createPackage(req, res, next) {
  try {
    const { name, price, duration_days, description } = req.body;
    if (!name || !price || !duration_days) {
      flash(req, 'flash_error', 'Vui lòng điền đầy đủ thông tin gói tập.');
      return res.redirect('/packages');
    }
    await pkgRepo.createPackage({ name, price, duration_days, description });
    flash(req, 'flash_success', `Đã thêm gói "${name}".`);
    res.redirect('/packages');
  } catch (err) { next(err); }
}

async function updatePackage(req, res, next) {
  try {
    const { name, price, duration_days, description, is_active } = req.body;
    if (!name || !price || !duration_days) {
      flash(req, 'flash_error', 'Vui lòng điền đầy đủ thông tin gói tập.');
      return res.redirect('/packages');
    }
    await pkgRepo.updatePackage(req.params.id, { 
      name, price, duration_days, description, 
      is_active: parseInt(is_active) // Parse số nguyên từ input form (0 hoặc 1)
    });
    flash(req, 'flash_success', `Đã cập nhật gói "${name}".`);
    res.redirect('/packages');
  } catch (err) { next(err); }
}

async function deletePackage(req, res, next) {
  try {
    await pkgRepo.deletePackage(req.params.id);
    flash(req, 'flash_success', 'Đã ngừng hoạt động gói tập.');
    res.redirect('/packages');
  } catch (err) { next(err); }
}

async function assignPackage(req, res, next) {
  try {
    const { user_id, package_id } = req.body;
    
    // 1. Tìm thông tin gói tập để lấy giá tiền và số ngày
    const pkg = await pkgRepo.findPackageById(package_id);
    if (!pkg) { 
      flash(req, 'flash_error', 'Không tìm thấy gói tập.'); 
      return res.redirect('/packages'); 
    }

    // 2. Chuyển thông tin cho Repo tự động lấy NOW() và tính Expired Date
    await pkgRepo.createMembership({ 
      user_id: parseInt(user_id), 
      package_id: parseInt(package_id), 
      price_paid: pkg.price, 
      duration_days: pkg.duration_days
    });
    
    flash(req, 'flash_success', `Đã gán gói tập "${pkg.name}" thành công.`);
    res.redirect('/packages');
  } catch (err) { next(err); }
}

async function deleteMembership(req, res, next) {
  try {
    await pkgRepo.deleteMembership(req.params.id);
    flash(req, 'flash_success', 'Đã hủy đăng ký gói tập.');
    res.redirect('/packages');
  } catch (err) { next(err); }
}

module.exports = { index, buyPackage, createPackage, updatePackage, deletePackage, assignPackage, deleteMembership };