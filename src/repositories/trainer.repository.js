const pool = require('../config/database');

async function findAll(status = null) {
  let q = 'SELECT t.*, u.username FROM trainers t LEFT JOIN users u ON t.user_id = u.id WHERE 1=1';
  const p = [];
  if (status) { q += ' AND t.status=?'; p.push(status); }
  q += ' ORDER BY t.full_name';
  const [rows] = await pool.query(q, p);
  return rows;
}

async function findById(id) {
  const [[row]] = await pool.query(
    'SELECT t.*, u.username FROM trainers t LEFT JOIN users u ON t.user_id = u.id WHERE t.id=?', [id]
  );
  return row || null;
}

async function findByUserId(userId) {
  const [[row]] = await pool.query('SELECT * FROM trainers WHERE user_id=?', [userId]);
  return row || null;
}

async function create({ trainer_code, full_name, specialization, phone, email, hire_date, user_id }) {
  const [r] = await pool.query(
    'INSERT INTO trainers (trainer_code, full_name, specialization, phone, email, hire_date, user_id) VALUES (?,?,?,?,?,?,?)',
    [trainer_code, full_name, specialization || null, phone || null, email || null, hire_date || null, user_id || null]
  );
  return r.insertId;
}

async function update(id, { full_name, specialization, phone, email, hire_date, status }) {
  await pool.query(
    'UPDATE trainers SET full_name=?, specialization=?, phone=?, email=?, hire_date=?, status=? WHERE id=?',
    [full_name, specialization || null, phone || null, email || null, hire_date || null, status || 'active', id]
  );
}

async function remove(id) {
  await pool.query('DELETE FROM trainers WHERE id=?', [id]);
}

async function getSchedule(trainerId) {
  const [rows] = await pool.query(
    'SELECT * FROM classes WHERE instructor=(SELECT full_name FROM trainers WHERE id=?) ORDER BY day, time',
    [trainerId]
  );
  return rows;
}

async function generateCode() {
  const [[row]] = await pool.query('SELECT COUNT(*)+1 AS n FROM trainers');
  return 'HLV' + String(row.n).padStart(3, '0');
}

module.exports = { findAll, findById, findByUserId, create, update, remove, getSchedule, generateCode };
