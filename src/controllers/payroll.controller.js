const payrollRepo = require('../repositories/payroll.repository');
const pool        = require('../config/database');

function flash(req, key, msg) { req.session[key] = msg; }
function popFlash(req) {
  const s = req.session.flash_success; delete req.session.flash_success;
  const e = req.session.flash_error;   delete req.session.flash_error;
  return { success: s || null, error: e || null };
}
function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

async function index(req, res, next) {
  try {
    const month = req.query.month || currentMonth();
    const [staffList, trainerList, payrollRows, summary] = await Promise.all([
      pool.query('SELECT * FROM staffs WHERE status="active" ORDER BY full_name').then(([r]) => r),
      pool.query('SELECT * FROM trainers WHERE status="active" ORDER BY full_name').then(([r]) => r),
      payrollRepo.getPayroll(month),
      payrollRepo.monthSummary(month),
    ]);

    // Tính số ngày công có mặt từ bảng attendance cho từng người
    const staffWithAtt  = await Promise.all(staffList.map(async s => {
      const att = await payrollRepo.countAttendance('staff', s.id, month);
      const pay = payrollRows.find(p => p.employee_type==='staff' && p.employee_ref_id===s.id);
      return { ...s, att, pay };
    }));
    const trainerWithAtt = await Promise.all(trainerList.map(async t => {
      const att = await payrollRepo.countAttendance('trainer', t.id, month);
      const pay = payrollRows.find(p => p.employee_type==='trainer' && p.employee_ref_id===t.id);
      // Số lớp dạy trong tháng
      const [[cls]] = await pool.query(
        `SELECT COUNT(*) AS cnt FROM simple_classes WHERE instructor=?`, [t.full_name]
      );
      return { ...t, att, pay, classes: cls.cnt };
    }));

    res.render('payroll', {
      title: 'Bảng lương', user: req.session.user,
      month, staffList: staffWithAtt, trainerList: trainerWithAtt,
      summary, ...popFlash(req),
    });
  } catch (err) { next(err); }
}

async function markAttendance(req, res, next) {
  try {
    const { employee_type, employee_ref_id, work_date, status, note } = req.body;
    await payrollRepo.markAttendance({ employee_type, employee_ref_id, work_date, status, note, created_by: req.session.user.id });
    flash(req, 'flash_success', 'Đã điểm danh.');
    res.redirect(`/payroll?month=${work_date.slice(0,7)}`);
  } catch (err) { next(err); }
}

async function calculatePayroll(req, res, next) {
  try {
    const { employee_type, employee_ref_id, month, working_days, bonus, deduction, note } = req.body;
    // Lấy lương cơ bản từ DB
    let base_salary = 0;
    if (employee_type === 'staff') {
      const [[s]] = await pool.query('SELECT salary FROM staffs WHERE id=?', [employee_ref_id]);
      base_salary = s ? Number(s.salary) : 0;
    } else {
      const [[t]] = await pool.query('SELECT salary FROM trainers WHERE id=?', [employee_ref_id]);
      base_salary = t ? Number(t.salary) : 0;
    }
    const att = await payrollRepo.countAttendance(employee_type, parseInt(employee_ref_id), month);
    const total = await payrollRepo.upsertPayroll({
      employee_type, employee_ref_id: parseInt(employee_ref_id), month,
      base_salary, working_days: parseInt(working_days) || 26,
      attended_days: att.present, bonus: Number(bonus)||0, deduction: Number(deduction)||0, note,
      created_by: req.session.user.id,
    });
    flash(req, 'flash_success', `Đã tính lương: ${Number(total).toLocaleString('vi-VN')}đ`);
    res.redirect(`/payroll?month=${month}`);
  } catch (err) { next(err); }
}

async function updateStatus(req, res, next) {
  try {
    await payrollRepo.updatePayrollStatus(req.params.id, req.body.status);
    flash(req, 'flash_success', 'Đã cập nhật trạng thái.');
    res.redirect(`/payroll?month=${req.body.month || currentMonth()}`);
  } catch (err) { next(err); }
}

async function deletePayroll(req, res, next) {
  try {
    await payrollRepo.deletePayroll(req.params.id);
    flash(req, 'flash_success', 'Đã xóa bản ghi lương.');
    res.redirect(`/payroll?month=${req.body.month || currentMonth()}`);
  } catch (err) { next(err); }
}

// Trang điểm danh chi tiết của 1 nhân viên/HLV trong tháng
async function attendanceDetail(req, res, next) {
  try {
    const { type, id } = req.params;
    const month = req.query.month || currentMonth();
    let person = null;
    if (type === 'staff') {
      const [[s]] = await pool.query('SELECT * FROM staffs WHERE id=?', [id]);
      person = s;
    } else {
      const [[t]] = await pool.query('SELECT * FROM trainers WHERE id=?', [id]);
      person = t;
    }
    if (!person) { flash(req, 'flash_error', 'Không tìm thấy.'); return res.redirect('/payroll'); }
    const attendance = await payrollRepo.getAttendance(type, id, month);
    const counts = await payrollRepo.countAttendance(type, id, month);
    // Tạo calendar days cho tháng
    const [y, m] = month.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const d = String(i+1).padStart(2,'0');
      const dateStr = `${month}-${d}`;
      const rec = attendance.find(a => a.work_date && new Date(a.work_date).toISOString().split('T')[0] === dateStr);
      const dayOfWeek = new Date(y, m-1, i+1).getDay();
      return { date: dateStr, day: i+1, rec, isWeekend: dayOfWeek === 0 || dayOfWeek === 6 };
    });
    res.render('payroll-attendance', {
      title: `Điểm danh — ${person.full_name}`, user: req.session.user,
      person, type, month, days, counts,
      ...popFlash(req),
    });
  } catch (err) { next(err); }
}

module.exports = { index, markAttendance, calculatePayroll, updateStatus, deletePayroll, attendanceDetail };
