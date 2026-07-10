const pool = require('../config/database');

async function findAll({ month, q: search, status } = {}) {
  let q = `SELECT p.*, u.full_name, u.username
    FROM payments p JOIN users u ON p.user_id = u.id WHERE 1=1`;
  const params = [];
  if (month)  { q += ' AND DATE_FORMAT(p.payment_date,"%Y-%m")=?'; params.push(month); }
  if (search) { q += ' AND (u.full_name LIKE ? OR p.invoice_code LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (status) { q += ' AND p.status=?'; params.push(status); }
  q += ' ORDER BY p.payment_date DESC, p.created_at DESC LIMIT 500';
  const [rows] = await pool.query(q, params);
  return rows;
}

async function monthlySummary() {
  const [rows] = await pool.query(`
    SELECT DATE_FORMAT(payment_date,'%Y-%m') AS month,
           SUM(CASE WHEN status='paid' THEN amount ELSE 0 END) AS revenue,
           COUNT(*) AS count
    FROM payments
    GROUP BY month ORDER BY month DESC LIMIT 12
  `);
  return rows;
}

async function statsThisMonth() {
  const [[row]] = await pool.query(`
    SELECT
      COALESCE(SUM(CASE WHEN status='paid' THEN amount ELSE 0 END),0) AS revenue,
      COALESCE(SUM(CASE WHEN status='pending' THEN amount ELSE 0 END),0) AS pending,
      COUNT(*) AS count
    FROM payments
    WHERE DATE_FORMAT(payment_date,'%Y-%m')=DATE_FORMAT(CURDATE(),'%Y-%m')
  `);
  return row;
}

async function statsTotal() {
  const [[row]] = await pool.query(
    `SELECT COALESCE(SUM(CASE WHEN status='paid' THEN amount ELSE 0 END),0) AS total FROM payments`
  );
  return row.total;
}

async function create({ user_id, membership_id, amount, payment_date, payment_method, status, note, created_by }) {
  const [r] = await pool.query(
    `INSERT INTO payments (user_id, membership_id, amount, payment_date, payment_method, status, note, created_by)
     VALUES (?,?,?,?,?,?,?,?)`,
    [user_id, membership_id || null, amount, payment_date, payment_method || 'cash', status || 'paid', note || null, created_by || null]
  );
  const ym = String(payment_date).slice(0, 7).replace('-', '');
  const code = `HD${ym}-${String(r.insertId).padStart(4, '0')}`;
  await pool.query('UPDATE payments SET invoice_code=? WHERE id=?', [code, r.insertId]);
  return r.insertId;
}

async function remove(id) {
  await pool.query('DELETE FROM payments WHERE id=?', [id]);
}

module.exports = { findAll, monthlySummary, statsThisMonth, statsTotal, create, remove };
