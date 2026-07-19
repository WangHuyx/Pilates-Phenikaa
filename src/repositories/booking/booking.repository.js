// src/repositories/booking.repository.js
const pool = require('../../config/database');

// =========================================================================
// HÀM FORMATTER (Ánh xạ CamelCase đồng bộ cho JavaScript đầu ra)
// =========================================================================
function formatBooking(row) {
  if (!row) return null;
  return {
    id: row.id,
    classId: row.class_id,
    className: row.class_name || null,
    classDate: row.class_date || null,
    startTime: row.start_time || null,
    endTime: row.end_time || null,
    roomName: row.room_name || null,
    userId: row.user_id,
    userFullName: row.user_full_name || null,
    userPhone: row.user_phone || null,
    registeredBy: row.registered_by,
    registeredByFullName: row.registered_by_full_name || null,
    status: row.status, // Mặc định: 'PENDING', 'APPROVED', 'ATTENDED'
    createdAt: row.created_at,
  };
}

// =========================================================================
// NGHIỆP VỤ ĐẶT LỊCH CỐT LÕI (CRUD & FILTERS)
// =========================================================================

/**
 * R5.3: Học viên đăng ký vào lớp tập (Hoặc Admin/Staff đăng ký hộ tại quầy)
 */
async function create({ classId, userId, registeredBy }) {
  const [result] = await pool.query(
    'INSERT INTO class_bookings (class_id, user_id, registered_by, status) VALUES (?, ?, ?, "PENDING")',
    [Number(classId), Number(userId), Number(registeredBy)]
  );
  return findById(result.insertId);
}

/**
 * Tra cứu chi tiết một lượt đặt chỗ cụ thể kèm thông tin lớp và người thực hiện
 */
async function findById(id) {
  const sql = `
    SELECT cb.*, 
           c.class_name, c.date AS class_date, c.start_time, c.end_time, c.room_name,
           u1.full_name AS user_full_name, u1.phone AS user_phone,
           u2.full_name AS registered_by_full_name
    FROM class_bookings cb
    JOIN classes c ON cb.class_id = c.id
    JOIN users u1 ON cb.user_id = u1.id
    JOIN users u2 ON cb.registered_by = u2.id
    WHERE cb.id = ?
  `;
  const [rows] = await pool.query(sql, [Number(id)]);
  return formatBooking(rows[0]);
}

/**
 * R5.5: Dành cho Admin/Staff quản lý, tìm kiếm lịch sử đặt chỗ toàn hệ thống
 */
async function findAll(filters = {}) {
  let sql = `
    SELECT cb.*, 
           c.class_name, c.date AS class_date, c.start_time, c.end_time, c.room_name,
           u1.full_name AS user_full_name, u1.phone AS user_phone
    FROM class_bookings cb
    JOIN classes c ON cb.class_id = c.id
    JOIN users u1 ON cb.user_id = u1.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.status) {
    sql += ' AND cb.status = ?';
    params.push(filters.status.toUpperCase());
  }
  if (filters.date) {
    sql += ' AND c.date = ?';
    params.push(filters.date);
  }
  if (filters.searchKeyword) {
    sql += ' AND (u1.full_name LIKE ? OR u1.phone LIKE ?)';
    const queryStr = `%${filters.searchKeyword}%`;
    params.push(queryStr, queryStr);
  }

  sql += ' ORDER BY cb.created_at DESC';
  const [rows] = await pool.query(sql, params);
  return rows.map(formatBooking);
}

/**
 * Dành cho PT/HLV: Xem danh sách học viên đã đặt chỗ trong ca học của mình (Phục vụ chuẩn bị lớp & điểm danh)
 */
async function findByClassId(classId) {
  const sql = `
    SELECT cb.*, u.full_name AS user_full_name, u.phone AS user_phone
    FROM class_bookings cb
    JOIN users u ON cb.user_id = u.id
    WHERE cb.class_id = ?
    ORDER BY cb.created_at ASC
  `;
  const [rows] = await pool.query(sql, [Number(classId)]);
  return rows.map(formatBooking);
}

/**
 * R1.5: Dành cho Hội viên: Tra cứu toàn bộ lịch sử đặt ca tập cá nhân (Hiển thị ở my-bookings.ejs)
 */
async function findByUserId(userId) {
  const sql = `
    SELECT cb.*, 
           c.class_name, c.date AS class_date, c.start_time, c.end_time, c.room_name,
           u.full_name AS user_full_name
    FROM class_bookings cb
    JOIN classes c ON cb.class_id = c.id
    JOIN users u ON cb.user_id = u.id
    WHERE cb.user_id = ?
    ORDER BY c.date DESC, c.start_time DESC
  `;
  const [rows] = await pool.query(sql, [Number(userId)]);
  return rows.map(formatBooking);
}

/**
 * R4.1 / R5.5: Cập nhật trạng thái đặt ca (Duyệt lớp: 'APPROVED', Điểm danh tại quầy: 'ATTENDED')
 */
async function updateStatus(id, status) {
  const upperStatus = status.toUpperCase(); // Đồng bộ ép viết hoa theo Enum của DB
  await pool.query('UPDATE class_bookings SET status = ? WHERE id = ?', [upperStatus, Number(id)]);
  return findById(id);
}

/**
 * Nghiệp vụ Hủy lịch đặt chỗ: Xóa bản ghi khỏi DB để trả lại slot trống cho lớp học
 */
async function remove(id) {
  const [result] = await pool.query('DELETE FROM class_bookings WHERE id = ?', [Number(id)]);
  return result.affectedRows > 0;
}

// =========================================================================
// HÀM BỔ TRỢ ĐẶC THÙ NGHIỆP VỤ (CHẶN BUG HỆ THỐNG)
// =========================================================================

/**
 * Hỗ trợ Kịch bản 3 nghiệp vụ: Kiểm tra số ca hội viên đã đặt trong 1 ngày cụ thể
 * Phục vụ tầng Service kiểm tra logic chặn giới hạn gói tập (daily_limit)
 */
async function countBookingsByUserAndDate(userId, date) {
  const sql = `
    SELECT COUNT(*) AS count 
    FROM class_bookings cb
    JOIN classes c ON cb.class_id = c.id
    WHERE cb.user_id = ? AND c.date = ? AND cb.status != 'PENDING'
  `;
  const [rows] = await pool.query(sql, [Number(userId), date]);
  return rows[0].count;
}

module.exports = {
  create,
  findById,
  findAll,
  findByClassId,
  findByUserId,
  updateStatus,
  remove,
  countBookingsByUserAndDate,
};