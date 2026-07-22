const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const BASE_QUERY = `
  SELECT u.*, r.name AS role_name
  FROM users u
  JOIN roles r ON u.role_id = r.id
`;

function formatUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role_name,
    roleId: row.role_id,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

async function findAll() {
  const [rows] = await pool.query(BASE_QUERY + ' ORDER BY u.id');
  return rows.map(formatUser);
}

async function findById(id) {
  const [rows] = await pool.query(BASE_QUERY + ' WHERE u.id = ?', [Number(id)]);
  return formatUser(rows[0]);
}

async function findByUsername(username) {
  const [rows] = await pool.query(
    BASE_QUERY + ' WHERE LOWER(u.username) = LOWER(?)',
    [username]
  );
  return formatUser(rows[0]);
}

async function create({ username, fullName, email, password, role, phone }) {
  const [roleRows] = await pool.query('SELECT id FROM roles WHERE name = ?', [role]);
  if (!roleRows.length) throw new Error('Role không hợp lệ.');
  const passwordHash = bcrypt.hashSync(password, 10);
  const [result] = await pool.query(
    'INSERT INTO users (username, password, email, full_name, phone, role_id) VALUES (?, ?, ?, ?, ?, ?)',
    [username, passwordHash, email || null, fullName, phone || null, roleRows[0].id]
  );
  return findById(result.insertId);
}

async function update(id, fields) {
  const setClauses = [];
  const values = [];

  if (fields.fullName !== undefined) { setClauses.push('full_name = ?'); values.push(fields.fullName); }
  if (fields.email !== undefined)    { setClauses.push('email = ?');     values.push(fields.email); }
  if (fields.role) {
    const [roleRows] = await pool.query('SELECT id FROM roles WHERE name = ?', [fields.role]);
    if (roleRows.length) { setClauses.push('role_id = ?'); values.push(roleRows[0].id); }
  }
  if (fields.password) {
    setClauses.push('password = ?');
    values.push(bcrypt.hashSync(fields.password, 10));
  }

  if (setClauses.length) {
    values.push(Number(id));
    await pool.query(`UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`, values);
  }
  return findById(id);
}

async function remove(id) {
  const [result] = await pool.query('DELETE FROM users WHERE id = ?', [Number(id)]);
  return result.affectedRows > 0;
}

module.exports = { findAll, findById, findByUsername, create, update, remove };
