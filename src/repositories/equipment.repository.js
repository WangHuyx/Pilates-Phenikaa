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


module.exports = {
  findAll, findById, create, update, remove, countByStatus,
};
