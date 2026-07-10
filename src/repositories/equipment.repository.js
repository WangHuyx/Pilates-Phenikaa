const pool = require('../config/database');

async function findAll(status = null) {
  let q = 'SELECT * FROM equipment WHERE 1=1';
  const p = [];
  if (status) { q += ' AND status=?'; p.push(status); }
  q += ' ORDER BY type, name';
  const [rows] = await pool.query(q, p);
  return rows;
}

async function findById(id) {
  const [[row]] = await pool.query('SELECT * FROM equipment WHERE id=?', [id]);
  return row || null;
}

async function create({ name, type, serial_number, status, notes }) {
  const [r] = await pool.query(
    'INSERT INTO equipment (name, type, serial_number, status, notes) VALUES (?,?,?,?,?)',
    [name, type || 'reformer', serial_number || null, status || 'active', notes || null]
  );
  return r.insertId;
}

async function update(id, { name, type, serial_number, status, notes }) {
  await pool.query(
    'UPDATE equipment SET name=?, type=?, serial_number=?, status=?, notes=? WHERE id=?',
    [name, type, serial_number || null, status, notes || null, id]
  );
}

async function remove(id) {
  await pool.query('DELETE FROM equipment WHERE id=?', [id]);
}

async function countByStatus() {
  const [rows] = await pool.query(
    `SELECT status, COUNT(*) AS cnt FROM equipment GROUP BY status`
  );
  const result = { active: 0, maintenance: 0, retired: 0 };
  rows.forEach(r => { result[r.status] = r.cnt; });
  return result;
}

// Maintenance logs
async function findLogs(equipmentId = null) {
  let q = `SELECT ml.*, e.name AS equipment_name, e.type AS equipment_type
    FROM maintenance_logs ml JOIN equipment e ON ml.equipment_id = e.id WHERE 1=1`;
  const p = [];
  if (equipmentId) { q += ' AND ml.equipment_id=?'; p.push(equipmentId); }
  q += ' ORDER BY ml.scheduled_date DESC LIMIT 200';
  const [rows] = await pool.query(q, p);
  return rows;
}

async function createLog({ equipment_id, scheduled_date, type, notes, created_by }) {
  const [r] = await pool.query(
    'INSERT INTO maintenance_logs (equipment_id, scheduled_date, type, notes, created_by) VALUES (?,?,?,?,?)',
    [equipment_id, scheduled_date, type || 'Bảo trì định kỳ', notes || null, created_by || null]
  );
  return r.insertId;
}

async function completeLog(id) {
  await pool.query(
    "UPDATE maintenance_logs SET completed_date=CURDATE(), status='completed' WHERE id=?", [id]
  );
}

async function deleteLog(id) {
  await pool.query('DELETE FROM maintenance_logs WHERE id=?', [id]);
}

async function upcomingMaintenance() {
  const [rows] = await pool.query(`
    SELECT ml.*, e.name AS equipment_name
    FROM maintenance_logs ml JOIN equipment e ON ml.equipment_id = e.id
    WHERE ml.status='scheduled' AND ml.scheduled_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    ORDER BY ml.scheduled_date
  `);
  return rows;
}

async function overdueCount() {
  const [[row]] = await pool.query(
    "SELECT COUNT(*) AS cnt FROM maintenance_logs WHERE status='scheduled' AND scheduled_date < CURDATE()"
  );
  // Also auto-mark overdue
  await pool.query(
    "UPDATE maintenance_logs SET status='overdue' WHERE status='scheduled' AND scheduled_date < CURDATE()"
  );
  return row.cnt;
}

module.exports = {
  findAll, findById, create, update, remove, countByStatus,
  findLogs, createLog, completeLog, deleteLog, upcomingMaintenance, overdueCount,
};
