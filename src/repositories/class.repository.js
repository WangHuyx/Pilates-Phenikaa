/**
 * class.repository.js
 * ------------------------------------------------------------------
 * Class thực hiện truy vấn dữ liệu
 * ------------------------------------------------------------------
 */
// TODO: Khi thêm một cơ sở dữ liệu thực, hãy thay thế các hàm giả lập này bằng các truy vấn cơ sở dữ liệu thực.
const classes = require('../data/classes.data');

/** @returns {Promise<object[]>} every class */
async function findAll() {
  return classes;
}

/**
 * @param {number|string} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  const match = classes.find((c) => c.id === Number(id));
  return match || null;
}

/**
 * Adds a user id to a class's enrolled list (idempotent).
 * @param {number|string} classId
 * @param {number} userId
 * @returns {Promise<object|null>} the updated class, or null if not found
 */
async function addUserToClass(classId, userId) {
  const targetClass = classes.find((c) => c.id === Number(classId));
  if (!targetClass) return null;

  if (!targetClass.enrolledUserIds.includes(userId)) {
    targetClass.enrolledUserIds.push(userId);
  }
  return targetClass;
}

/**
 * @param {number} userId
 * @returns {Promise<object[]>} classes the given user is enrolled in
 */
async function findClassesByUserId(userId) {
  return classes.filter((c) => c.enrolledUserIds.includes(userId));
}

module.exports = {
  findAll,
  findById,
  addUserToClass,
  findClassesByUserId,
};
