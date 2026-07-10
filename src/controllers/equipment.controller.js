const eqRepo = require('../repositories/equipment.repository');

function flash(req, key, msg) { req.session[key] = msg; }
function popFlash(req) {
  const s = req.session.flash_success; delete req.session.flash_success;
  const e = req.session.flash_error;   delete req.session.flash_error;
  return { success: s || null, error: e || null };
}

async function index(req, res, next) {
  try {
    const { status } = req.query;
    const [equipment, counts, logs, upcoming] = await Promise.all([
      eqRepo.findAll(status || null),
      eqRepo.countByStatus(),
      eqRepo.findLogs(),
      eqRepo.upcomingMaintenance(),
    ]);
    await eqRepo.overdueCount();
    const overdueItems = logs.filter(l => l.status === 'overdue');
    res.render('equipment', {
      title: 'Thiết bị', user: req.session.user,
      equipment, counts, logs, upcoming, overdueItems,
      filterStatus: status || 'all',
      ...popFlash(req),
    });
  } catch (err) { next(err); }
}

async function create(req, res) {
  const { name, type, serial_number, status, notes } = req.body;
  try {
    if (!name) throw new Error('Vui lòng nhập tên thiết bị.');
    await eqRepo.create({ name, type, serial_number, status, notes });
    flash(req, 'flash_success', `Đã thêm thiết bị "${name}".`);
  } catch (err) { flash(req, 'flash_error', err.message); }
  res.redirect('/equipment');
}

async function update(req, res) {
  const { name, type, serial_number, status, notes } = req.body;
  try {
    await eqRepo.update(req.params.id, { name, type, serial_number, status, notes });
    flash(req, 'flash_success', 'Cập nhật thiết bị thành công.');
  } catch (err) { flash(req, 'flash_error', err.message); }
  res.redirect('/equipment');
}

async function remove(req, res) {
  try {
    await eqRepo.remove(req.params.id);
    flash(req, 'flash_success', 'Đã xóa thiết bị.');
  } catch (err) { flash(req, 'flash_error', err.message); }
  res.redirect('/equipment');
}

async function createLog(req, res) {
  const { equipment_id, scheduled_date, type, notes } = req.body;
  try {
    if (!equipment_id || !scheduled_date) throw new Error('Thiếu thông tin lịch bảo trì.');
    await eqRepo.createLog({ equipment_id, scheduled_date, type, notes, created_by: req.session.user.id });
    flash(req, 'flash_success', 'Đã thêm lịch bảo trì.');
  } catch (err) { flash(req, 'flash_error', err.message); }
  res.redirect('/equipment');
}

async function completeLog(req, res) {
  try {
    await eqRepo.completeLog(req.params.id);
    flash(req, 'flash_success', 'Đã đánh dấu hoàn thành bảo trì.');
  } catch (err) { flash(req, 'flash_error', err.message); }
  res.redirect('/equipment');
}

async function deleteLog(req, res) {
  try {
    await eqRepo.deleteLog(req.params.id);
    flash(req, 'flash_success', 'Đã xóa lịch bảo trì.');
  } catch (err) { flash(req, 'flash_error', err.message); }
  res.redirect('/equipment');
}

module.exports = { index, create, update, remove, createLog, completeLog, deleteLog };
