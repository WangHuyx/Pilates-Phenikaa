/**
 * class.service.js
 * ------------------------------------------------------------------
* TẦNG DỊCH VỤ (SERVICE LAYER) — chứa logic nghiệp vụ cho các lớp học và việc đặt chỗ Pilates.
 * Các quy tắc như "không đặt trùng lịch" hay "tuân thủ giới hạn sĩ số lớp"
 * được đặt tại đây, chứ không phải ở tầng điều khiển (controller) hay tầng lưu trữ (repository).
 * ------------------------------------------------------------------
 */

const classRepository = require('../repositories/class.repository');

/** @returns {Promise<object[]>} */
async function listClasses() {
  return classRepository.findAll();
}

/**
 * @param {number|string} classId
 * @param {number} userId
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function registerForClass(classId, userId) {
  const targetClass = await classRepository.findById(classId);

  if (!targetClass) {
    return { success: false, message: 'That class could not be found.' };
  }

  if (targetClass.enrolledUserIds.includes(userId)) {
    return { success: false, message: `You're already booked into ${targetClass.name}.` };
  }

  if (targetClass.enrolledUserIds.length >= targetClass.capacity) {
    return { success: false, message: `${targetClass.name} is fully booked.` };
  }

  await classRepository.addUserToClass(classId, userId);
  return { success: true, message: `You're booked into ${targetClass.name}.` };
}

/**
 * @param {number} userId
 * @returns {Promise<object[]>} classes a user has booked
 */
async function myClasses(userId) {
  return classRepository.findClassesByUserId(userId);
}

async function getClassById(id) {
  return classRepository.findById(id);
}

module.exports = { listClasses, registerForClass, myClasses, getClassById };
