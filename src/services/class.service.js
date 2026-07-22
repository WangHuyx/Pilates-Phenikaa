/**
 * class.service.js
 * ------------------------------------------------------------------
* TẦNG DỊCH VỤ (SERVICE LAYER) — chứa logic nghiệp vụ cho các lớp học và việc đặt chỗ Pilates.
 * Các quy tắc như "không đặt trùng lịch" hay "tuân thủ giới hạn sĩ số lớp"
 * được đặt tại đây, chứ không phải ở tầng điều khiển (controller) hay tầng lưu trữ (repository).
 * ------------------------------------------------------------------
 */

const classRepo = require('../repositories/class/class.repository');
const packageRepo = require('../repositories/package/package.repository');
const paymentRepo = require('../repositories/payment.repository');

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

  // Lặp qua từng lớp để gắn dữ liệu member đã duyệt (Phục vụ Popover UI)
  for (let c of classes) {
    // Chỉ những đăng ký ĐÃ DUYỆT mới "có mặt" trên lịch (tính vào sĩ số + danh sách học viên).
    // Người đang chờ duyệt (vé lượt) chưa được tính cho tới khi admin xử lý.
    const enrollments = await classRepo.findEnrollmentsByClassId(c.id);
    c.enrolledUsers = enrollments;
    c.enrolledUserIds = enrollments.map(e => e.user_id);

    // Trạng thái đăng ký của riêng người dùng hiện tại (kể cả đang pending) —
    // tra riêng, không phụ thuộc vào danh sách đã duyệt ở trên.
    const myEnrollment = await classRepo.findEnrollmentForUser(c.id, userId);
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

  const targetClass = await classRepo.findClassById(classId);
  if (!targetClass) return { success: false, message: 'Lớp học không tồn tại.' };

  // 2. Kiểm tra hội viên có đang là VIP (gói tháng còn hiệu lực) không
  const activeSub = await packageRepo.findActiveSubscription(userId);

  if (activeSub) {
    // TH1: Đã là VIP -> tự động duyệt, không thu tiền vé lượt
    await classRepo.createEnrollment(classId, userId, {
      status: 'approved',
      bookingType: 1,
      paymentStatus: 'completed',
      subscriptionId: activeSub.id,
    });
    return { success: true, message: `Đặt chỗ "${targetClass.name}" thành công (dùng gói VIP đang có hiệu lực).` };
  }

  // TH2: Chưa có gói VIP -> thu tiền vé lượt + gửi admin duyệt
  const price = Number(targetClass.price) || 0;
  const enrollmentId = await classRepo.createEnrollment(classId, userId, {
    status: 'pending',
    bookingType: 0,
    paymentStatus: price > 0 ? 'pending' : 'completed',
  });

  if (price > 0) {
    await paymentRepo.create({
      user_id: userId,
      membership_id: null,
      package_id: null,
      type: 'class',
      amount: price,
      payment_date: new Date().toISOString().slice(0, 10),
      payment_method: 'cash',
      status: 'pending',
      note: `Vé lượt: ${targetClass.name}`,
      created_by: null,
      class_enrollment_id: enrollmentId,
    });
    return {
      success: true,
      message: `Đã gửi yêu cầu đặt chỗ "${targetClass.name}" kèm vé lượt ${price.toLocaleString('vi-VN')}đ. Vui lòng chờ admin duyệt.`,
    };
  }

  return { success: true, message: `Đã gửi yêu cầu đặt chỗ "${targetClass.name}". Vui lòng chờ duyệt!` };
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
