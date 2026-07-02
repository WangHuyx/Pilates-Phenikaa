/**
 * class.repository.js
 * ------------------------------------------------------------------
 * Lớp thực hiện truy vấn dữ liệu lớp học từ MySQL
 * ------------------------------------------------------------------
 */

const pool = require('../config/database');

/**
 * Định dạng dữ liệu lớp học từ DB thành cấu trúc object mong đợi,
 * đồng thời gắn thêm danh sách ID học viên đã đăng ký.
 */
async function attachEnrollmentsToClass(classObj) {
  if (!classObj) return null;
  const [enrollments] = await pool.query(
    'SELECT user_id FROM simple_class_enrollments WHERE class_id = ?',
    [classObj.id]
  );
  classObj.enrolledUserIds = enrollments.map(e => e.user_id);
  return classObj;
}

/** 
 * Lấy danh sách toàn bộ các lớp học
 * @returns {Promise<object[]>} Mảng chứa thông tin tất cả lớp học
 */
async function findAll() {
  const [classes] = await pool.query('SELECT * FROM simple_classes');
  
  // Gắn thêm danh sách người đăng ký cho từng lớp
  const formattedClasses = await Promise.all(classes.map(async (cls) => {
    return await attachEnrollmentsToClass(cls);
  }));
  
  return formattedClasses;
}

/**
 * Tìm một lớp học thông qua ID.
 * @param {number|string} id - ID của lớp học
 * @returns {Promise<object|null>} Trả về đối tượng lớp học hoặc null
 */
async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM simple_classes WHERE id = ?', [Number(id)]);
  if (rows.length === 0) return null;
  
  return await attachEnrollmentsToClass(rows[0]);
}

/**
 * Thêm một ID người dùng vào danh sách đăng ký của một lớp (không thêm trùng lặp).
 * @param {number|string} classId - ID lớp học
 * @param {number} userId - ID người dùng
 * @returns {Promise<object|null>} Trả về lớp học đã được cập nhật, hoặc null nếu không tìm thấy
 */
async function addUserToClass(classId, userId) {
  const targetClass = await findById(classId);
  if (!targetClass) return null;

  try {
    // Sử dụng INSERT IGNORE để tránh lỗi trùng lặp nếu người dùng đã đăng ký trước đó
    await pool.query(
      'INSERT IGNORE INTO simple_class_enrollments (class_id, user_id) VALUES (?, ?)',
      [Number(classId), Number(userId)]
    );
  } catch (err) {
    console.error('Lỗi khi thêm user vào class:', err);
  }

  // Lấy lại thông tin mới nhất sau khi cập nhật
  return await findById(classId);
}

/**
 * Lấy danh sách các lớp học mà một người dùng đã đăng ký tham gia.
 * @param {number} userId - ID của người dùng
 * @returns {Promise<object[]>} Danh sách các lớp học người dùng đã đăng ký
 */
async function findClassesByUserId(userId) {
  const [rows] = await pool.query(`
    SELECT c.* 
    FROM simple_classes c
    JOIN simple_class_enrollments e ON c.id = e.class_id
    WHERE e.user_id = ?
  `, [Number(userId)]);

  const formattedClasses = await Promise.all(rows.map(async (cls) => {
    return await attachEnrollmentsToClass(cls);
  }));
  
  return formattedClasses;
}

module.exports = {
  findAll,
  findById,
  addUserToClass,
  findClassesByUserId,
};
