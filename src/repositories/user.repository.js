/**
 * user.repository.js
 * ------------------------------------------------------------------
 * Lớp thực hiện truy vấn dữ liệu người dùng từ MySQL
 * ------------------------------------------------------------------
 */

const pool = require('../config/database');

/**
 * Định dạng dữ liệu thô từ cơ sở dữ liệu thành đối tượng người dùng (user) chuẩn
 */
function formatUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password, // Ánh xạ trường mật khẩu của DB thành trường được mong đợi trong mã nguồn
    fullName: row.full_name,
    email: row.email,
    roleId: row.role_id,
    createdAt: row.created_at
  };
}

/**
 * Tìm một người dùng theo tên đăng nhập (không phân biệt hoa thường).
 * @param {string} username - Tên đăng nhập cần tìm
 * @returns {Promise<object|null>} Trả về thông tin người dùng hoặc null nếu không tìm thấy
 */
async function findByUsername(username) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE LOWER(username) = LOWER(?)',
    [username]
  );
  return formatUser(rows[0]);
}

/**
 * Tìm một người dùng thông qua ID.
 * @param {number|string} id - ID của người dùng
 * @returns {Promise<object|null>} Trả về thông tin người dùng hoặc null nếu không tìm thấy
 */
async function findById(id) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE id = ?',
    [Number(id)]
  );
  return formatUser(rows[0]);
}

module.exports = {
  findByUsername,
  findById,
};
