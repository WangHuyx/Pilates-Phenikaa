/**
 * class.repository.js
 * ------------------------------------------------------------------
 * Lớp thực hiện truy vấn dữ liệu lớp học từ MySQL
 * ------------------------------------------------------------------
 */

const pool = require('../../config/database');

// --- THỐNG KÊ (DASHBOARD) ---
async function countMembers() {
  const [[row]] = await pool.query(`SELECT COUNT(*) AS cnt FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'member'`);
  return row.cnt;
}
async function countStaff() {
  const [[row]] = await pool.query(`SELECT COUNT(*) AS cnt FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name IN ('staff', 'admin')`).catch(() => [[{ cnt: 0 }]]);
  return row.cnt;
}
async function countBookingsByUser(userId) {
  const [[row]] = await pool.query(`SELECT COUNT(*) AS cnt FROM class_enrollments WHERE user_id = ?`, [userId]);
  return row.cnt;
}
async function countClasses() {
  const [[row]] = await pool.query(`SELECT COUNT(*) AS cnt FROM classes`);
  return row.cnt;
}
// --- TRUY VẤN LỚP HỌC ---
async function findAllClasses() {
  const [classes] = await pool.query(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM class_enrollments WHERE class_id = c.id AND status IN ('approved', 'pending')) AS registeredCount,
      (SELECT COUNT(*) FROM class_enrollments WHERE class_id = c.id AND status = 'approved') AS enrolledCount
    FROM classes c 
  `);
  return classes;
}

// FIX: chỉ lấy các đăng ký đã được admin duyệt — người đang "chờ duyệt" (vé lượt
// chưa xử lý) không được tính vào sĩ số / danh sách học viên hiển thị trên lịch.
async function findEnrollmentsByClassId(classId) {
  const [enrollments] = await pool.query(`
    SELECT ce.status, ce.booking_type, u.id AS user_id, u.full_name AS name
    FROM class_enrollments ce
    JOIN users u ON ce.user_id = u.id
    WHERE ce.class_id = ? AND ce.status = 'approved'
  `, [classId]);
  return enrollments;
}

// Lấy đăng ký (pending/approved) của CHÍNH người dùng hiện tại cho 1 lớp cụ thể —
// dùng để hiển thị đúng trạng thái "Đang chờ duyệt" của riêng họ, tách biệt khỏi
// danh sách học viên đã duyệt ở trên (vốn không còn chứa người đang chờ duyệt).
async function findEnrollmentForUser(classId, userId) {
  const [[row]] = await pool.query(
    `SELECT * FROM class_enrollments
     WHERE class_id = ? AND user_id = ? AND status IN ('pending', 'approved')
     ORDER BY created_at DESC LIMIT 1`,
    [classId, userId]
  );
  return row || null;
}

async function findClassById(id) {
  const [[cls]] = await pool.query('SELECT * FROM classes WHERE id = ?', [id]);
  return cls || null;
}

// --- TRUY VẤN ĐẶT CHỖ (ENROLLMENT) ---
async function checkExistingEnrollment(classId, userId) {
  const [[existing]] = await pool.query(
    `SELECT id FROM class_enrollments WHERE class_id = ? AND user_id = ? AND status IN ('pending', 'approved')`,
    [classId, userId]
  );
  return existing || null;
}

async function createEnrollment(classId, userId, {
  status = 'pending',
  bookingType = 0,
  paymentStatus = 'completed',
  subscriptionId = null,
} = {}) {
  const [result] = await pool.query(
    `INSERT INTO class_enrollments (class_id, user_id, status, booking_type, payment_status, subscription_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [classId, userId, status, bookingType ? 1 : 0, paymentStatus, subscriptionId]
  );
  return result.insertId;
}

async function findBookingsByUserId(userId) {
  const [rows] = await pool.query(`
    SELECT ce.id AS enrollment_id, ce.status, ce.booking_type, ce.payment_status, ce.created_at,
           c.name, c.instructor, c.day, c.time, c.level, c.capacity
    FROM class_enrollments ce
    JOIN classes c ON ce.class_id = c.id
    WHERE ce.user_id = ?
    ORDER BY ce.created_at DESC
  `, [userId]);
  return rows;
}

async function updateEnrollmentStatus(enrollmentId, userId, status) {
  await pool.query(`UPDATE class_enrollments SET status = ? WHERE id = ? AND user_id = ?`, [status, enrollmentId, userId]);
}

// --- TRUY VẤN ADMIN APPROVALS ---
async function findPendingEnrollments() {
  const [rows] = await pool.query(`
    SELECT ce.id AS enrollment_id, ce.created_at, ce.booking_type, ce.payment_status,
           u.full_name AS user_fullname, u.username,
           c.name AS class_name, c.instructor, c.day AS class_day, c.time AS class_time
    FROM class_enrollments ce
    JOIN users u ON ce.user_id = u.id
    JOIN classes c ON ce.class_id = c.id
    WHERE ce.status = 'pending'
    ORDER BY ce.created_at ASC
  `);
  return rows;
}

async function approveEnrollment(enrollmentId, adminId) {
  await pool.query(
    `UPDATE class_enrollments SET status = 'approved', payment_status = 'completed', approved_by = ?, approved_at = NOW() WHERE id = ?`,
    [adminId, enrollmentId]
  );
}

async function rejectEnrollment(enrollmentId, adminId, note) {
  await pool.query(
    `UPDATE class_enrollments SET status = 'rejected', payment_status = 'cancelled', admin_note = ?, approved_by = ?, approved_at = NOW() WHERE id = ?`,
    [note || null, adminId, enrollmentId]
  );
}

// FIX: sĩ số lớp giới hạn tối đa 8 — chặn lại ở backend phòng trường hợp
// form bị sửa/gửi trực tiếp với giá trị lớn hơn.
const MAX_CLASS_CAPACITY = 8;
function clampCapacity(capacity) {
  return Math.min(parseInt(capacity) || MAX_CLASS_CAPACITY, MAX_CLASS_CAPACITY);
}

// --- TRUY VẤN ADMIN CRUD CLASS ---
async function createClass(data) {
  const { name, instructor, day, time, level, capacity, price } = data;
  await pool.query(
    'INSERT INTO classes (name, instructor, day, time, level, capacity, price) VALUES (?,?,?,?,?,?,?)',
    [name, instructor || null, day, time, level, clampCapacity(capacity), parseInt(price) || 0]
  );
}

async function updateClass(id, data) {
  const { name, instructor, day, time, level, capacity, price } = data;
  await pool.query(
    'UPDATE classes SET name=?, instructor=?, day=?, time=?, level=?, capacity=?, price=? WHERE id=?',
    [name, instructor || null, day, time, level, clampCapacity(capacity), parseInt(price) || 0, id]
  );
}

async function deleteClass(id) {
  // Bắt buộc xóa ở bảng con (class_enrollments) trước để tránh lỗi Khóa ngoại (Foreign Key)
  await pool.query('DELETE FROM class_enrollments WHERE class_id=?', [id]);
  // Sau đó mới xóa lớp ở bảng cha
  await pool.query('DELETE FROM classes WHERE id=?', [id]);
}

async function getBookingStats() {
  const [[classes]] = await pool.query('SELECT COUNT(*) AS total_classes FROM classes');
  const [[bookings]] = await pool.query('SELECT COUNT(*) AS total_bookings FROM class_enrollments');
  return {
    total_classes: classes.total_classes,
    total_bookings: bookings.total_bookings
  };
}

async function createCheckin(data) {
  await pool.query(
    'INSERT INTO attendances (member_id, checked_by, check_in_time, status) VALUES (?, ?, ?, ?)',
    [data.user_id, data.checked_by, data.check_in_time || new Date(), 'present']
  );
}

module.exports = {
  countMembers, countStaff, countBookingsByUser, countClasses,
  findAllClasses, findEnrollmentsByClassId, findEnrollmentForUser, findClassById,
  checkExistingEnrollment, createEnrollment, findBookingsByUserId, updateEnrollmentStatus,
  findPendingEnrollments, approveEnrollment, rejectEnrollment,
  createClass, updateClass, deleteClass, getBookingStats, createCheckin
};
