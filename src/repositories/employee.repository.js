const pool = require('../config/database');

const COLORS = ['green', 'blue', 'amber', 'purple', 'pink', 'teal'];

function getInitials(name) {
  return name.trim().split(/\s+/).map(w => w[0]).slice(-3).join('').toUpperCase();
}

function formatEmployee(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.staff_code,
    fullName: row.full_name,
    email: row.email || '',
    phone: row.phone || '',
    position: row.role || '',
    department: row.department || '',
    salary: row.salary || 0,
    status: row.status,
    startDate: row.start_date ? new Date(row.start_date).toISOString().slice(0, 10) : '',
    avatar: getInitials(row.full_name),
    avatarColor: COLORS[row.id % COLORS.length],
  };
}

async function findAll(status) {
  let sql = 'SELECT * FROM staffs';
  const params = [];
  if (status && status !== 'all') {
    sql += ' WHERE status = ?';
    params.push(status);
  }
  sql += ' ORDER BY id';
  const [rows] = await pool.query(sql, params);
  return rows.map(formatEmployee);
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM staffs WHERE id = ?', [Number(id)]);
  return formatEmployee(rows[0]);
}

async function create({ fullName, phone, email, position, department, startDate }) {
  const [result] = await pool.query(
    'INSERT INTO staffs (staff_code, full_name, email, phone, role, department, start_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['TEMP', fullName, email || null, phone, position, department || null, startDate || null]
  );
  const id = result.insertId;
  const code = 'NV' + String(id).padStart(3, '0');
  await pool.query('UPDATE staffs SET staff_code = ? WHERE id = ?', [code, id]);
  return findById(id);
}

async function update(id, fields) {
  const sets = [];
  const vals = [];
  const map = { fullName: 'full_name', phone: 'phone', email: 'email', position: 'role', department: 'department', startDate: 'start_date', status: 'status' };
  for (const [key, col] of Object.entries(map)) {
    if (fields[key] !== undefined) {
      sets.push(`${col} = ?`);
      vals.push(fields[key] === '' ? null : fields[key]);
    }
  }
  if (!sets.length) return findById(id);
  vals.push(Number(id));
  await pool.query(`UPDATE staffs SET ${sets.join(', ')} WHERE id = ?`, vals);
  return findById(id);
}

async function remove(id) {
  const [result] = await pool.query('DELETE FROM staffs WHERE id = ?', [Number(id)]);
  return result.affectedRows > 0;
}

async function findScheduleAssignments(weekStart, weekEnd) {
  const [rows] = await pool.query(
    'SELECT * FROM employee_schedule_assignments WHERE date BETWEEN ? AND ? ORDER BY date, employee_id',
    [weekStart, weekEnd]
  );
  return rows;
}

async function addAssignment({ employeeId, shiftId, date, note }) {
  const [result] = await pool.query(
    'INSERT IGNORE INTO employee_schedule_assignments (employee_id, shift_id, date, note) VALUES (?, ?, ?, ?)',
    [Number(employeeId), shiftId, date, note || null]
  );
  return result.insertId;
}

async function deleteAssignment(id) {
  const [result] = await pool.query('DELETE FROM employee_schedule_assignments WHERE id = ?', [Number(id)]);
  return result.affectedRows > 0;
}

module.exports = { findAll, findById, create, update, remove, findScheduleAssignments, addAssignment, deleteAssignment };
