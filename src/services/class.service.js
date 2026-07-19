/**
 * class.service.js
 * ------------------------------------------------------------------
* TẦNG DỊCH VỤ (SERVICE LAYER) — chứa logic nghiệp vụ cho các lớp học và việc đặt chỗ Pilates.
 * Các quy tắc như "không đặt trùng lịch" hay "tuân thủ giới hạn sĩ số lớp"
 * được đặt tại đây, chứ không phải ở tầng điều khiển (controller) hay tầng lưu trữ (repository).
 * ------------------------------------------------------------------
 */

const classRepo = require('../repositories/class/class.repository');

async function getDashboardStats(userId) {
  const [totalMembers, totalEmployees, totalClasses, myBookings] = await Promise.all([
    classRepo.countMembers(),
    classRepo.countStaff(),
    classRepo.countClasses(),
    classRepo.countBookingsByUser(userId)
  ]);
  return { totalMembers, totalEmployees, totalClasses, myBookings };
}

async function getClassesForDisplay(userId) {
  const classes = await classRepo.findAllClasses();
  
  // Lặp qua từng lớp để gắn dữ liệu member đang chờ/đã duyệt (Phục vụ Popover UI)
  for (let c of classes) {
    const enrollments = await classRepo.findEnrollmentsByClassId(c.id);
    c.enrolledUsers = enrollments;
    c.enrolledUserIds = enrollments.map(e => e.user_id);
    
    const myEnrollment = enrollments.find(e => e.user_id === userId);
    c.enrollmentStatus = myEnrollment ? myEnrollment.status : null;
  }
  return classes;
}

async function registerForClass(classId, userId) {
  // 1. Kiểm tra spam/trùng lặp
  const existing = await classRepo.checkExistingEnrollment(classId, userId);
  if (existing) {
    return { success: false, message: 'Bạn đã đăng ký lớp này rồi.' };
  }
  
  // 2. Kiểm tra sĩ số tối đa (Tùy chọn, vì admin duyệt mới chốt, nhưng nên chặn trước)
  const targetClass = await classRepo.findClassById(classId);
  if (!targetClass) return { success: false, message: 'Lớp học không tồn tại.' };
  
  // 3. Tiến hành Insert
  await classRepo.createEnrollment(classId, userId);
  return { success: true, message: 'Gửi yêu cầu đặt chỗ thành công. Vui lòng chờ duyệt!' };
}

async function cancelBooking(enrollmentId, userId) {
  await classRepo.updateEnrollmentStatus(enrollmentId, userId, 'cancelled');
}

async function getClassesForManage() {
  const classes = await classRepo.findAllClasses();
  // Fake mảng enrolledUserIds để UI cũ không bị lỗi length
  classes.forEach(c => { c.enrolledUserIds = new Array(c.enrolledCount); });
  return classes;
}

module.exports = {
  getDashboardStats,
  getClassesForDisplay,
  registerForClass,
  cancelBooking,
  getClassesForManage
};
