const pool = require('../config/database');

async function findAllPackages() {
  const [rows] = await pool.query('SELECT * FROM membership_packages ORDER BY price');
  return rows;
}

async function findPackageById(id) {
  const [[row]] = await pool.query('SELECT * FROM membership_packages WHERE id=?', [id]);
  return row || null;
}

async function createPackage({ name, category, price, duration_days, description, features }) {
  const [r] = await pool.query(
    'INSERT INTO membership_packages (name, category, price, duration_days, description, features) VALUES (?,?,?,?,?,?)',
    [name, category || 'Pilates', parseInt(price), parseInt(duration_days), description || null, features || null]
  );
  return r.insertId;
}

async function updatePackage(id, { name, category, price, duration_days, description, features }) {
  await pool.query(
    'UPDATE membership_packages SET name=?, category=?, price=?, duration_days=?, description=?, features=? WHERE id=?',
    [name, category || 'Pilates', parseInt(price), parseInt(duration_days), description || null, features || null, id]
  );
}

async function deletePackage(id) {
  await pool.query('DELETE FROM membership_packages WHERE id=?', [id]);
}

async function findAllMemberships() {
  const [rows] = await pool.query(`
    SELECT mm.*, u.full_name, u.username, p.name AS package_name, p.price, p.duration_days
    FROM member_memberships mm
    JOIN users u ON mm.user_id = u.id
    JOIN membership_packages p ON mm.package_id = p.id
    ORDER BY mm.created_at DESC
  `);
  return rows;
}

async function createMembership({ user_id, package_id, start_date, end_date, note }) {
  const [r] = await pool.query(
    'INSERT INTO member_memberships (user_id, package_id, start_date, end_date, note) VALUES (?,?,?,?,?)',
    [user_id, package_id, start_date, end_date, note || null]
  );
  return r.insertId;
}

async function deleteMembership(id) {
  await pool.query('DELETE FROM member_memberships WHERE id=?', [id]);
}

async function countActive() {
  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM member_memberships WHERE status='active' AND end_date >= CURDATE()`
  );
  return row.cnt;
}

module.exports = { findAllPackages, findPackageById, createPackage, updatePackage, deletePackage, findAllMemberships, createMembership, deleteMembership, countActive };
