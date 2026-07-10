const pool = require('../config/database');

// Mã HV: HV + id zero-padded 3 chữ số
function toMemberCode(id) {
  return 'HV' + String(id).padStart(3, '0');
}

// Tìm user theo mã HV (HV006) hoặc số điện thoại
async function findUserByCodeOrPhone(input) {
  const clean = (input || '').trim();
  // Mã HV
  if (/^HV\d+$/i.test(clean)) {
    const id = parseInt(clean.replace(/^HV/i, ''), 10);
    const [[user]] = await pool.query('SELECT * FROM users WHERE id=?', [id]);
    return user || null;
  }
  // Số điện thoại
  const [[user]] = await pool.query('SELECT * FROM users WHERE phone=?', [clean]);
  return user || null;
}

async function findCurrentlyIn() {
  const [rows] = await pool.query(`
    SELECT c.*, u.full_name, u.username, u.id AS uid
    FROM checkins c JOIN users u ON c.user_id = u.id
    WHERE DATE(c.check_in_time) = CURDATE() AND c.check_out_time IS NULL
    ORDER BY c.check_in_time ASC
  `);
  return rows.map(r => ({ ...r, member_code: toMemberCode(r.uid) }));
}

async function findToday() {
  const [rows] = await pool.query(`
    SELECT c.*, u.full_name, u.username, u.id AS uid
    FROM checkins c JOIN users u ON c.user_id = u.id
    WHERE DATE(c.check_in_time) = CURDATE()
    ORDER BY c.check_in_time DESC
  `);
  return rows.map(r => ({ ...r, member_code: toMemberCode(r.uid) }));
}

async function findAll({ date, dateFrom, dateTo, q: search } = {}) {
  let q = `SELECT c.*, u.full_name, u.username, u.id AS uid
    FROM checkins c JOIN users u ON c.user_id = u.id WHERE 1=1`;
  const p = [];
  if (date)     { q += ' AND DATE(c.check_in_time)=?'; p.push(date); }
  if (dateFrom) { q += ' AND DATE(c.check_in_time)>=?'; p.push(dateFrom); }
  if (dateTo)   { q += ' AND DATE(c.check_in_time)<=?'; p.push(dateTo); }
  if (search)   {
    q += ' AND (u.full_name LIKE ? OR CONCAT("HV", LPAD(u.id,3,"0")) LIKE ?)';
    p.push(`%${search}%`, `%${search}%`);
  }
  q += ' ORDER BY c.check_in_time DESC LIMIT 500';
  const [rows] = await pool.query(q, p);
  return rows;
}

async function checkin(user_id, note, created_by) {
  const [r] = await pool.query(
    'INSERT INTO checkins (user_id, note, created_by) VALUES (?,?,?)',
    [user_id, note || null, created_by || null]
  );
  return r.insertId;
}

async function checkout(id) {
  await pool.query(
    'UPDATE checkins SET check_out_time=NOW() WHERE id=? AND check_out_time IS NULL',
    [id]
  );
}

async function countToday() {
  const [[row]] = await pool.query(
    'SELECT COUNT(*) AS cnt FROM checkins WHERE DATE(check_in_time)=CURDATE()'
  );
  return row.cnt;
}

module.exports = { findToday, findCurrentlyIn, findAll, checkin, checkout, countToday, findUserByCodeOrPhone, toMemberCode };
