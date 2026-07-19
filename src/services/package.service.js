/**
 * package.service.js
 * ------------------------------------------------------------------
 * Nghiệp vụ Quản lý danh mục gói, đăng ký mua, hủy gói & hoàn tiền (R2, R6)
 * Đã đồng bộ hoàn toàn sang chữ thường (lowercase) cho mọi trạng thái.
 * ------------------------------------------------------------------
 */

const packageRepository = require('../repositories/package.repository');

class PackageService {
  
  // Lấy danh sách tất cả các gói tập hiện có tại phòng tập
  static async getAllPackages() {
    return packageRepository.findAll();
  }

  // Hội viên tự đăng ký mua gói tháng trực tuyến (R2.3)
  static async registerMonthlyPackage(userId, packageId) {
    const pkg = await packageRepository.findById(packageId);
    if (!pkg || pkg.type !== 'month') {
      throw new Error('Gói tập yêu cầu không hợp lệ.');
    }

    // Kiểm tra xem hội viên này đã sở hữu gói tháng active nào chưa
    const today = new Date().toISOString().slice(0, 10);
    const activePkg = await packageRepository.findActiveMemberPackage(userId, today);
    if (activePkg) {
      throw new Error('Bạn đang sử dụng một gói tập tháng còn hiệu lực.');
    }

    // Tạo bản ghi đăng ký gói tháng ở trạng thái chờ duyệt (pending)
    const memberPackageId = await packageRepository.createMemberPackage({
      user_id: userId,
      package_id: packageId,
      status: 'pending' // Viết thường: 'pending'
    });

    // Khởi tạo hóa đơn thanh toán tạm thời ở trạng thái pending
    await packageRepository.createPayment({
      user_id: userId,
      amount: pkg.price,
      payment_type: 'month_package',
      reference_id: memberPackageId,
      status: 'pending' // Viết thường: 'pending'
    });

    return { success: true, message: 'Đăng ký gói thành công! Vui lòng chuyển khoản thanh toán.' };
  }

  // Admin/Staff duyệt kích hoạt gói tháng khi đã nhận đủ tiền (R2.3 approve)
  static async approvePackage(memberPackageId) {
    const memberPkg = await packageRepository.findMemberPackageById(memberPackageId);
    if (!memberPkg) throw new Error('Không tìm thấy yêu cầu đăng ký gói.');
    
    const pkg = await packageRepository.findById(memberPkg.package_id);

    // Tính toán thời hạn gói (Ngày bắt đầu là hôm nay, kết thúc dựa trên duration_days)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + pkg.duration_days);

    // Kích hoạt gói tháng sang trạng thái hoạt động 'active'
    await packageRepository.updateMemberPackageStatus(memberPackageId, {
      start_date: startDate.toISOString().slice(0, 10),
      end_date: endDate.toISOString().slice(0, 10),
      status: 'active' // Viết thường: 'active'
    });

    // Chuyển hóa đơn liên quan sang trạng thái đã thanh toán 'paid'
    await packageRepository.updatePaymentStatusByRef(memberPackageId, 'month_package', 'paid');

    return { success: true, message: 'Duyệt và kích hoạt thẻ gói tháng thành công!' };
  }

  // Hội viên gửi yêu cầu báo hủy gói tập (R2.5)
  static async requestCancelPackage(memberPackageId) {
    const memberPkg = await packageRepository.findMemberPackageById(memberPackageId);
    if (!memberPkg || memberPkg.status !== 'active') { // Viết thường: 'active'
      throw new Error('Gói tập không ở trạng thái hoạt động để có thể hủy.');
    }

    // Chuyển trạng thái sang pending_cancel để chờ Admin duyệt
    await packageRepository.updateMemberPackageStatusOnly(memberPackageId, 'pending_cancel');
    return { success: true, message: 'Yêu cầu hủy gói đã gửi thành công. Vui lòng chờ quản trị viên duyệt.' };
  }

  // Admin phê duyệt yêu cầu hủy gói và hoàn tiền thủ công cho khách (R2.5 approve)
  static async approveCancelAndRefund(memberPackageId) {
    const memberPkg = await packageRepository.findMemberPackageById(memberPackageId);
    if (!memberPkg || memberPkg.status !== 'pending_cancel') { // Viết thường: 'pending_cancel'
      throw new Error('Yêu cầu hủy gói không hợp lệ.');
    }

    // 1. Chuyển trạng thái gói sang cancelled (Đã hủy)
    await packageRepository.updateMemberPackageStatusOnly(memberPackageId, 'cancelled');

    // 2. Chuyển hóa đơn sang refunded (Để tự động trừ đi khi tính toán báo cáo tài chính R8.2)
    await packageRepository.updatePaymentStatusByRef(memberPackageId, 'month_package', 'refunded');

    return { success: true, message: 'Đã hoàn tất thủ tục hủy gói tập và hoàn tiền thành công.' };
  }
}

module.exports = PackageService;