const pool = require('../config/database');

// ─── Attendance ───────────────────────────────────────────────
async function getAttendance(employee_type, employee_ref_id, month) {
  const [rows] = await pool.query(
    `SELECT * FROM staff_attendance
     WHERE employee_type=? AND employee_ref_id=?
       AND DATE_FORMAT(work_date,'%Y-%m')=?
     ORDER BY work_date`,
    [employee_type, employee_ref_id, month]
  );
  return rows;
}

async function markAttendance({ employee_type, employee_ref_id, work_date, status, note, created_by }) {
  await pool.query(
    `INSERT INTO staff_attendance (employee_type, employee_ref_id, work_date, status, note, created_by)
     VALUES (?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE status=VALUES(status), note=VALUES(note)`,
    [employee_type, employee_ref_id, work_date, status, note || null, created_by || null]
  );
}

async function deleteAttendance(id) {
  await pool.query('DELETE FROM staff_attendance WHERE id=?', [id]);
}

async function countAttendance(employee_type, employee_ref_id, month) {
  const [[row]] = await pool.query(
    `SELECT
       SUM(CASE WHEN status='present'  THEN 1 ELSE 0 END) AS present,
       SUM(CASE WHEN status='half_day' THEN 0.5 ELSE 0 END) AS half_days,
       SUM(CASE WHEN status='late'     THEN 1 ELSE 0 END) AS late,
       SUM(CASE WHEN status='absent'   THEN 1 ELSE 0 END) AS absent,
       COUNT(*) AS total_marked
     FROM staff_attendance
     WHERE employee_type=? AND employee_ref_id=? AND DATE_FORMAT(work_date,'%Y-%m')=?`,
    [employee_type, employee_ref_id, month]
  );
  return {
    present:  (row.present || 0) + (row.half_days || 0) + (row.late || 0),
    absent:   row.absent || 0,
    total:    row.total_marked || 0,
  };
}

// ─── Payroll ─────────────────────────────────────────────────
async function getPayroll(month) {
  const [rows] = await pool.query(
    `SELECT pr.*,
       CASE WHEN pr.employee_type='staff'   THEN s.full_name  ELSE t.full_name  END AS full_name,
       CASE WHEN pr.employee_type='staff'   THEN s.role       ELSE t.specialization END AS position
     FROM payroll_records pr
     LEFT JOIN staffs   s ON pr.employee_type='staff'   AND pr.employee_ref_id=s.id
     LEFT JOIN trainers t ON pr.employee_type='trainer' AND pr.employee_ref_id=t.id
     WHERE pr.month=? ORDER BY pr.employee_type, full_name`,
    [month]
  );
  return rows;
}

async function upsertPayroll({ employee_type, employee_ref_id, month, base_salary, working_days, attended_days, bonus, deduction, note, created_by }) {
  const total = Math.round((base_salary / working_days) * attended_days) + Number(bonus || 0) - Number(deduction || 0);
  await pool.query(
    `INSERT INTO payroll_records
       (employee_type, employee_ref_id, month, base_salary, working_days, attended_days, bonus, deduction, total_salary, note, created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
       base_salary=VALUES(base_salary), working_days=VALUES(working_days),
       attended_days=VALUES(attended_days), bonus=VALUES(bonus),
       deduction=VALUES(deduction), total_salary=VALUES(total_salary), note=VALUES(note)`,
    [employee_type, employee_ref_id, month, base_salary, working_days, attended_days, bonus || 0, deduction || 0, total, note || null, created_by || null]
  );
  return total;
}

async function updatePayrollStatus(id, status) {
  await pool.query('UPDATE payroll_records SET status=? WHERE id=?', [status, id]);
}

async function deletePayroll(id) {
  await pool.query('DELETE FROM payroll_records WHERE id=?', [id]);
}

async function monthSummary(month) {
  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS count,
       COALESCE(SUM(CASE WHEN status='paid' THEN total_salary ELSE 0 END),0) AS paid,
       COALESCE(SUM(total_salary),0) AS total
     FROM payroll_records WHERE month=?`,
    [month]
  );
  return row;
}

module.exports = { getAttendance, markAttendance, deleteAttendance, countAttendance, getPayroll, upsertPayroll, updatePayrollStatus, deletePayroll, monthSummary };
