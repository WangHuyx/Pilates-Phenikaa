const paymentRepo = require('../repositories/payment.repository');
const userRepo    = require('../repositories/user.repository');
const packageRepo = require('../repositories/package.repository');

function flash(req, key, msg) { req.session[key] = msg; }
function popFlash(req) {
  const s = req.session.flash_success; delete req.session.flash_success;
  const e = req.session.flash_error;   delete req.session.flash_error;
  return { success: s || null, error: e || null };
}

async function index(req, res, next) {
  try {
    const { month, q, status } = req.query;
    const [payments, users, packages, stats] = await Promise.all([
      paymentRepo.findAll({ month, q, status }),
      userRepo.findAll(),
      packageRepo.findAllPackages(),
      paymentRepo.statsOverall(),
    ]);
    const filteredPaidTotal = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    res.render('finance', {
      title: 'Tài chính', user: req.session.user,
      payments, members: users, packages, stats,
      filteredPaidTotal,
      filterMonth: month || '',
      filterSearch: q || '',
      filterStatus: status || '',
      ...popFlash(req),
    });
  } catch (err) { next(err); }
}

async function createPayment(req, res, next) {
  try {
    const { user_id, package_id, type, amount, payment_date, payment_method, status, note } = req.body;
    if (!user_id || !amount || !payment_date) {
      flash(req, 'flash_error', 'Vui lòng điền đầy đủ thông tin thanh toán.');
      return res.redirect('/finance');
    }
    await paymentRepo.create({
      user_id: parseInt(user_id),
      package_id: package_id ? parseInt(package_id) : null,
      type, amount: parseInt(amount),
      payment_date, payment_method, status: status || 'paid', note,
      created_by: req.session.user.id,
    });
    flash(req, 'flash_success', 'Đã ghi nhận thanh toán thành công.');
    res.redirect('/finance');
  } catch (err) { next(err); }
}

async function deletePayment(req, res, next) {
  try {
    await paymentRepo.remove(req.params.id);
    flash(req, 'flash_success', 'Đã xóa bản ghi thanh toán.');
    res.redirect('/finance');
  } catch (err) { next(err); }
}

module.exports = { index, createPayment, deletePayment };
