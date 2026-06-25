/**
 * user.repository.js
 * ------------------------------------------------------------------
 * Class thực hiện truy vấn dữ liệu
 * ------------------------------------------------------------------
 */
//TODO: Khi thêm một cơ sở dữ liệu thực, hãy thay thế các hàm giả lập này bằng các truy vấn cơ sở dữ liệu thực.
const users = require('../data/users.data');

/**
 * Find a single user by username (case-insensitive).
 * @param {string} username
 * @returns {Promise<object|null>}
 */
async function findByUsername(username) {
  const match = users.find(
    (u) => u.username.toLowerCase() === String(username || '').toLowerCase()
  );
  return match || null;
}

/**
 * Find a single user by numeric id.
 * @param {number|string} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  const match = users.find((u) => u.id === Number(id));
  return match || null;
}

module.exports = {
  findByUsername,
  findById,
};
