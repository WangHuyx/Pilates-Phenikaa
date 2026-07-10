const trainerRepo = require('../repositories/trainer.repository');

function flash(req, key, msg) { req.session[key] = msg; }
function popFlash(req) {
  const s = req.session.flash_success; delete req.session.flash_success;
  const e = req.session.flash_error;   delete req.session.flash_error;
  return { success: s || null, error: e || null };
}

async function index(req, res, next) {
  try {
    const { status } = req.query;
    const [trainers, all] = await Promise.all([
      trainerRepo.findAll(status || null),
      trainerRepo.findAll(),
    ]);
    res.render('trainers', {
      title: 'Huấn luyện viên', user: req.session.user,
      trainers, total: all.length,
      totalActive:   all.filter(t => t.status === 'active').length,
      totalInactive: all.filter(t => t.status !== 'active').length,
      filterStatus: status || 'all',
      ...popFlash(req),
    });
  } catch (err) { next(err); }
}

async function showEdit(req, res, next) {
  try {
    const trainer = await trainerRepo.findById(req.params.id);
    if (!trainer) { flash(req, 'flash_error', 'Không tìm thấy huấn luyện viên.'); return res.redirect('/trainers'); }
    const schedule = await trainerRepo.getSchedule(req.params.id);
    res.render('trainers-edit', { title: 'Cập nhật HLV', user: req.session.user, trainer, schedule, error: null });
  } catch (err) { next(err); }
}

async function create(req, res) {
  const { full_name, specialization, phone, email, hire_date } = req.body;
  try {
    if (!full_name) throw new Error('Vui lòng nhập tên huấn luyện viên.');
    const trainer_code = await trainerRepo.generateCode();
    await trainerRepo.create({ trainer_code, full_name, specialization, phone, email, hire_date });
    flash(req, 'flash_success', `Đã thêm huấn luyện viên "${full_name}".`);
  } catch (err) { flash(req, 'flash_error', err.message); }
  res.redirect('/trainers');
}

async function update(req, res) {
  const { full_name, specialization, phone, email, hire_date, status } = req.body;
  try {
    if (!full_name) throw new Error('Tên không được để trống.');
    await trainerRepo.update(req.params.id, { full_name, specialization, phone, email, hire_date, status });
    flash(req, 'flash_success', 'Cập nhật huấn luyện viên thành công.');
  } catch (err) { flash(req, 'flash_error', err.message); }
  res.redirect('/trainers');
}

async function remove(req, res) {
  try {
    await trainerRepo.remove(req.params.id);
    flash(req, 'flash_success', 'Đã xóa huấn luyện viên.');
  } catch (err) { flash(req, 'flash_error', err.message); }
  res.redirect('/trainers');
}

module.exports = { index, showEdit, create, update, remove };
