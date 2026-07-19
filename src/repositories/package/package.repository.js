const pool = require('../../config/database');

async function findAllPackages() {
  const [rows] = await pool.query('SELECT * FROM membership_packages ORDER BY price');
  return rows;
}

async function findPackageById(id) {
  const [[row]] = await pool.query('SELECT * FROM membership_packages WHERE id=?', [id]);
  return row || null;
}

async function createPackage({ name, price, duration_days, description }) {
  const [result] = await pool.query(
    'INSERT INTO membership_packages (name, price, duration_days, description, is_active) VALUES (?, ?, ?, ?, 1)',
    [name, parseInt(price), parseInt(duration_days), description || null]
  );
  return result.insertId;
}
// Sửa thông tin gói tập
async function updatePackage(id, { name, price, duration_days, description, is_active }) {
  const [result] = await pool.query(
    'UPDATE membership_packages SET name = ?, price = ?, duration_days = ?, description = ?, is_active = ? WHERE id = ?',
    [name, parseInt(price), parseInt(duration_days), description || null, is_active !== undefined ? is_active : 1, id]
  );
  return result.affectedRows > 0; // Trả về true nếu update thành công
}
async function deletePackage(id) {
  await pool.query('DELETE FROM membership_packages WHERE id=?', [id]);
}

// Sửa cho admin xem gói mà tất cả member đăng kí
async function findAllMemberships() {
  const [rows] = await pool.query(`
    SELECT us.*, u.full_name, u.username, p.name AS package_name, p.duration_days
    FROM user_subscriptions us
    JOIN users u ON us.user_id = u.id
    JOIN membership_packages p ON us.package_id = p.id
    ORDER BY us.created_at DESC
  `);
  return rows;
}
// Lấy danh sách gói tập của một member cụ thể
async function findMembershipsByUserId(userId) {
  const [rows] = await pool.query(`
    SELECT us.*, p.name AS package_name
    FROM user_subscriptions us
    JOIN membership_packages p ON us.package_id = p.id
    WHERE us.user_id = ?
    ORDER BY us.created_at DESC
  `, [userId]);
  return rows;
}
// Sửa cho member tự đăng kí gói
// Lưu ý: Cần truyền price_paid (giá thực tế lúc mua) và duration_days từ package vào đây
async function createMembership({ user_id, package_id, price_paid, duration_days }) {
  const [r] = await pool.query(
    `INSERT INTO user_subscriptions (user_id, package_id, price_paid, activated_at, expired_at) 
     VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY))`,
    [user_id, package_id, parseInt(price_paid), parseInt(duration_days)]
  );
  return r.insertId;
}

// Sửa để deactive gói của user (Dành cho admin)
// Nên dùng Soft Delete (đổi trạng thái) thay vì DELETE cứng để giữ lịch sử thanh toán
async function deleteMembership(id) {
  await pool.query(
    `UPDATE user_subscriptions SET payment_status = 'cancelled' WHERE id = ?`, 
    [id]
  );
}

// Sửa để xem có bao nhiêu gói đang còn hạn
async function countActive() {
  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS cnt 
     FROM user_subscriptions 
     WHERE payment_status = 'completed' AND expired_at >= NOW()`
  );
  return row.cnt;
}

module.exports = { findAllPackages, findPackageById, createPackage, updatePackage, deletePackage, findAllMemberships, findMembershipsByUserId, createMembership, deleteMembership, countActive };
