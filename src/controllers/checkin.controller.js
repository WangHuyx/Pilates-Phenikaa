const checkinRepo = require('../repositories/checkin.repository');
const pool        = require('../config/database');

function flash(req, key, msg) { req.session[key] = msg; }
function popFlash(req) {
  const s = req.session.flash_success; delete req.session.flash_success;
  const e = req.session.flash_error;   delete req.session.flash_error;
  return { success: s || null, error: e || null };
}

async function index(req, res, next) {
  try {
    const [currentlyIn, todayAll, todayCount] = await Promise.all([
      checkinRepo.findCurrentlyIn(),
      checkinRepo.findToday(),
      checkinRepo.countToday(),
    ]);
    const [members] = await pool.query(
      `SELECT u.id, u.full_name, u.phone FROM users u JOIN roles r ON u.role_id=r.id WHERE r.name='member' ORDER BY u.id LIMIT 5`
    );
    const demoCodes = members.map(m => checkinRepo.toMemberCode(m.id)).join(', ');

    res.render('checkin', {
      title: 'Check-in', user: req.session.user,
      currentlyIn, todayAll, todayCount, demoCodes,
      ...popFlash(req),
    });
  } catch (err) { next(err); }
}

async function history(req, res, next) {
  try {
    const { dateFrom, dateTo, q } = req.query;
    const checkins = await checkinRepo.findAll({ dateFrom, dateTo, q });
    res.render('checkin-history', {
      title: 'Lịch sử Check-in', user: req.session.user,
      checkins,
      filterDateFrom: dateFrom || '',
      filterDateTo: dateTo || '',
      filterSearch: q || '',
    });
  } catch (err) { next(err); }
}

async function exportHistory(req, res, next) {
  try {
    const { dateFrom, dateTo, q } = req.query;
    const checkins = await checkinRepo.findAll({ dateFrom, dateTo, q });
    const rows = [['Hội viên', 'Mã HV', 'Ngày', 'Giờ vào', 'Giờ ra', 'Thời gian tập', 'Ghi chú']];
    checkins.forEach(c => {
      const code = 'HV' + String(c.uid || c.user_id).padStart(3, '0');
      const date = new Date(c.check_in_time).toLocaleDateString('vi-VN');
      const timeIn  = new Date(c.check_in_time).toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' });
      const timeOut = c.check_out_time ? new Date(c.check_out_time).toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' }) : 'Đang tập';
      let dur = '';
      if (c.check_out_time) {
        const mins = Math.round((new Date(c.check_out_time) - new Date(c.check_in_time)) / 60000);
        dur = (Math.floor(mins/60) > 0 ? Math.floor(mins/60) + 'h ' : '') + (mins%60) + 'p';
      }
      rows.push([c.full_name, code, date, timeIn, timeOut, dur, c.note || '']);
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="lich-su-checkin.csv"');
    res.send('﻿' + csv);
  } catch (err) { next(err); }
}

// Check-in bằng mã HV hoặc số điện thoại
async function doCheckinByCode(req, res, next) {
  try {
    const { code } = req.body;
    if (!code || !code.trim()) {
      flash(req, 'flash_error', 'Vui lòng nhập mã hội viên hoặc số điện thoại.');
      return res.redirect('/checkin');
    }
    const user = await checkinRepo.findUserByCodeOrPhone(code.trim());
    if (!user) {
      flash(req, 'flash_error', `Không tìm thấy hội viên với mã hoặc SĐT: "${code.trim()}"`);
      return res.redirect('/checkin');
    }
    await checkinRepo.checkin(user.id, null, req.session.user.id);
    flash(req, 'flash_success', `Check-in thành công cho ${user.full_name}!`);
    res.redirect('/checkin');
  } catch (err) { next(err); }
}

// Check-in bằng dropdown (legacy)
async function doCheckin(req, res, next) {
  try {
    const { user_id, note } = req.body;
    if (!user_id) { flash(req, 'flash_error', 'Vui lòng chọn hội viên.'); return res.redirect('/checkin'); }
    await checkinRepo.checkin(parseInt(user_id), note, req.session.user.id);
    flash(req, 'flash_success', 'Check-in thành công!');
    res.redirect('/checkin');
  } catch (err) { next(err); }
}

async function doCheckout(req, res, next) {
  try {
    await checkinRepo.checkout(req.params.id);
    flash(req, 'flash_success', 'Check-out thành công!');
    res.redirect('/checkin');
  } catch (err) { next(err); }
}

module.exports = { index, history, exportHistory, doCheckin, doCheckinByCode, doCheckout };
