/**
 * admin.controller.js
 * ------------------------------------------------------------------
 * CONTROLLER LAYER: Đóng gói toàn bộ các hoạt động quản trị của Admin & Staff.
 * - Thống kê & Dashboard Tổng quan (R8)
 * - Quản lý Tài khoản, Hội viên, Staff & Check-in tại quầy (R1, R3, R4)
 * - Quản lý Giao dịch, Duyệt Gói tháng & Hoàn tiền Hủy gói (R2, R6)
 * - Quản lý Danh mục Gói tập của Trung tâm (R2.1, R2.2)
 * - Thiết lập Lịch & CRUD Lớp học Pilates (R5.1, R5.2, R5.5)
 * - Quản lý & Thống kê Thiết bị máy tập (R7.1)
 * - Tính lương Nhân viên & PT theo tháng (R3.3)
 * - Xuất báo cáo doanh thu Excel chuyên nghiệp (R8.3)
 * ------------------------------------------------------------------
 */

const ExcelJS = require('exceljs');
const accountService = require('../services/account.service');
const packageService = require('../services/package.service');
const classService = require('../services/class.service');

// Các Repository hỗ trợ truy vấn trực tiếp cơ sở dữ liệu
const userRepository = require('../repositories/user.repository');
const packageRepository = require('../repositories/package.repository');
const classRepository = require('../repositories/class.repository');
const paymentRepository = require('../repositories/payment.repository');
const equipmentRepository = require('../repositories/equipment.repository');

class AdminController {

  /**
   * Helper tĩnh hỗ trợ đọc & giải phóng thông báo flash nhanh gọn trong Session
   */
  static _popFlash(req) {
    const success = req.session.flash_success || null;
    const error = req.session.flash_error || null;
    delete req.session.flash_success;
    delete req.session.flash_error;
    return { success, error };
  }

  // ==========================================================================
  // PHẦN 1: THỐNG KÊ & DASHBOARD QUẢN TRỊ (R8.1, R8.2)
  // ==========================================================================

  static async showDashboard(req, res, next) {
    try {
      const userStats = await userRepository.countByRoles(); 
      const classStats = await classRepository.getBookingStats();
      const revenueStats = await paymentRepository.getTotalRevenue();

      res.render('admin/dashboard', {
        title: 'Bảng Điều Khiển Quản Trị',
        user: req.session.user,
        stats: {
          members: userStats.member || 0,
          trainers: userStats.trainer || 0,
          staff: userStats.staff || 0,
          classes: classStats.total_classes || 0,
          bookings: classStats.total_bookings || 0,
          revenue: revenueStats.total || 0
        },
        ...AdminController._popFlash(req)
      });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // PHẦN 2: QUẢN LÝ TÀI KHOẢN, HỘI VIÊN & CHECK-IN TẠI QUẦY (R1, R3, R4)
  // ==========================================================================

  static async listMembers(req, res, next) {
    try {
      const { q, role } = req.query;
      const users = await userRepository.findAll({ search: q, role: role || null });

      res.render('admin/members', {
        title: 'Quản lý Hội viên & Nhân sự',
        user: req.session.user,
        members: users,
        filterSearch: q || '',
        filterRole: role || 'all',
        ...AdminController._popFlash(req)
      });
    } catch (err) {
      next(err);
    }
  }

  static async checkinMember(req, res, next) {
    try {
      const memberId = req.params.id;
      const staffId = req.session.user.id;

      await classRepository.createCheckin({
        user_id: memberId,
        checked_by: staffId,
        check_in_time: new Date()
      });

      req.session.flash_success = 'Điểm danh check-in hội viên thành công!';
      res.redirect('/admin/members');
    } catch (err) {
      req.session.flash_error = err.message;
      res.redirect('/admin/members');
    }
  }

  static async createAccount(req, res, next) {
    try {
      const { username, password, full_name, role, phone } = req.body;
      
      await accountService.createUser({ 
        username, 
        password, 
        fullName: full_name, 
        role: role.toLowerCase(),
        phone 
      });

      req.session.flash_success = `Đã tạo tài khoản thành công cho: ${full_name}`;
      res.redirect('/admin/members');
    } catch (err) {
      req.session.flash_error = err.message;
      res.redirect('/admin/members');
    }
  }

  static async deleteAccount(req, res, next) {
    try {
      const targetId = req.params.id;
      const currentUserId = req.session.user.id;

      await accountService.deleteUser(targetId, currentUserId);

      req.session.flash_success = 'Đã xóa tài khoản ra khỏi hệ thống phòng tập.';
      res.redirect('/admin/members');
    } catch (err) {
      req.session.flash_error = err.message;
      res.redirect('/admin/members');
    }
  }

  // ==========================================================================
  // PHẦN 3: DUYỆT ĐĂNG KÝ GÓI TẬP, DUYỆT HỦY GÓI HOÀN TIỀN (R2.3, R2.5, R6)
  // ==========================================================================

  static async listPayments(req, res, next) {
    try {
      const { status, month } = req.query;
      const payments = await paymentRepository.findAll({ status, month });

      res.render('admin/payments', {
        title: 'Quản lý Hóa đơn & Giao dịch',
        user: req.session.user,
        payments,
        filterStatus: status || 'all',
        filterMonth: month || '',
        ...AdminController._popFlash(req)
      });
    } catch (err) {
      next(err);
    }
  }

  static async approveMonthlyPackage(req, res, next) {
    try {
      const memberPackageId = req.params.id;
      await packageService.approvePackage(memberPackageId);

      req.session.flash_success = 'Đã duyệt thanh toán! Kích hoạt gói tháng thành công cho hội viên.';
      res.redirect('/admin/payments');
    } catch (err) {
      req.session.flash_error = err.message;
      res.redirect('/admin/payments');
    }
  }

  static async approveCancelAndRefund(req, res, next) {
    try {
      const memberPackageId = req.params.id;
      await packageService.approveCancelAndRefund(memberPackageId);

      req.session.flash_success = 'Đã hủy thẻ gói tháng và ghi nhận hoàn tiền cho khách thành công!';
      res.redirect('/admin/payments');
    } catch (err) {
      req.session.flash_error = err.message;
      res.redirect('/admin/payments');
    }
  }

  // ==========================================================================
  // PHẦN 4: THIẾT LẬP LỚP HỌC (CRUD LỚP) (R5.1, R5.2, R5.5)
  // ==========================================================================

  static async manageClasses(req, res, next) {
    try {
      const classes = await classService.listClasses();
      res.render('admin/classes-mgmt', {
        title: 'Quản lý Lớp học',
        user: req.session.user,
        classes,
        ...AdminController._popFlash(req),
      });
    } catch (err) { 
      next(err); 
    }
  }

  static async createClass(req, res, next) {
    try {
      const { name, instructor, day, time, level, capacity } = req.body;
      if (!name || !instructor || !day || !time) {
        req.session.flash_error = 'Vui lòng điền đầy đủ thông tin bắt buộc.';
        return res.redirect('/admin/classes-mgmt');
      }
      await classRepository.create({
        name,
        instructor,
        day,
        time,
        level,
        capacity: parseInt(capacity) || 10
      });
      req.session.flash_success = `Đã tạo lớp học "${name}" thành công.`;
      res.redirect('/admin/classes-mgmt');
    } catch (err) { 
      next(err); 
    }
  }

  static async showEditClass(req, res, next) {
    try {
      const cls = await classService.getClassById(req.params.id);
      if (!cls) { 
        req.session.flash_error = 'Không tìm thấy lớp học yêu cầu.'; 
        return res.redirect('/admin/classes-mgmt'); 
      }
      res.render('admin/classes-edit', { 
        title: 'Sửa lớp học', 
        user: req.session.user, 
        cls, 
        error: null 
      });
    } catch (err) { 
      next(err); 
    }
  }

  static async updateClass(req, res, next) {
    try {
      const { name, instructor, day, time, level, capacity } = req.body;
      await classRepository.update(req.params.id, {
        name,
        instructor,
        day,
        time,
        level,
        capacity: parseInt(capacity) || 10
      });
      req.session.flash_success = 'Cập nhật thông tin lớp học thành công.';
      res.redirect('/admin/classes-mgmt');
    } catch (err) { 
      next(err); 
    }
  }

  static async deleteClass(req, res, next) {
    try {
      await classRepository.remove(req.params.id);
      req.session.flash_success = 'Đã xóa lớp học thành công.';
      res.redirect('/admin/classes-mgmt');
    } catch (err) { 
      next(err); 
    }
  }

  // ==========================================================================
  // PHẦN 5: QUẢN LÝ DANH MỤC GÓI TẬP (R2.1, R2.2)
  // ==========================================================================

  static async managePackages(req, res, next) {
    try {
      const packages = await packageRepository.findAll();
      res.render('admin/packages-mgmt', {
        title: 'Quản lý Gói tập',
        user: req.session.user,
        packages,
        ...AdminController._popFlash(req)
      });
    } catch (err) {
      next(err);
    }
  }

  static async createPackage(req, res, next) {
    try {
      const { name, type, price, duration_days, daily_limit } = req.body;
      if (!name || !price || !duration_days) {
        req.session.flash_error = 'Vui lòng nhập đầy đủ thông tin gói tập.';
        return res.redirect('/admin/packages-mgmt');
      }
      await packageRepository.create({
        name,
        type: type.toLowerCase(), // Đồng bộ chữ thường ('month' hoặc 'day')
        price: parseFloat(price),
        duration_days: parseInt(duration_days),
        daily_limit: parseInt(daily_limit) || 1
      });
      req.session.flash_success = `Đã thêm mới gói tập "${name}" thành công.`;
      res.redirect('/admin/packages-mgmt');
    } catch (err) {
      next(err);
    }
  }

  static async deletePackage(req, res, next) {
    try {
      await packageRepository.remove(req.params.id);
      req.session.flash_success = 'Đã xóa gói tập thành công.';
      res.redirect('/admin/packages-mgmt');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // PHẦN 6: QUẢN LÝ THIẾT BỊ PHÒNG TẬP (R7.1)
  // ==========================================================================

  static async manageEquipments(req, res, next) {
    try {
      const equipments = await equipmentRepository.findAll();
      res.render('admin/equipments', {
        title: 'Quản lý Thiết bị',
        user: req.session.user,
        equipments,
        ...AdminController._popFlash(req)
      });
    } catch (err) {
      next(err);
    }
  }

  static async createEquipment(req, res, next) {
    try {
      const { name, quantity } = req.body;
      if (!name || !quantity) {
        req.session.flash_error = 'Tên máy và số lượng không được bỏ trống.';
        return res.redirect('/admin/equipments');
      }
      await equipmentRepository.create({
        name,
        quantity: parseInt(quantity)
      });
      req.session.flash_success = `Đã thêm thiết bị "${name}" vào danh sách.`;
      res.redirect('/admin/equipments');
    } catch (err) {
      next(err);
    }
  }

  static async updateEquipment(req, res, next) {
    try {
      const { name, quantity } = req.body;
      await equipmentRepository.update(req.params.id, {
        name,
        quantity: parseInt(quantity)
      });
      req.session.flash_success = 'Cập nhật thông tin thiết bị thành công.';
      res.redirect('/admin/equipments');
    } catch (err) {
      next(err);
    }
  }

  static async deleteEquipment(req, res, next) {
    try {
      await equipmentRepository.remove(req.params.id);
      req.session.flash_success = 'Đã xóa thiết bị khỏi danh sách.';
      res.redirect('/admin/equipments');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // PHẦN 8: BÁO CÁO DOANH THU & XUẤT FILE EXCEL (R8.3)
  // ==========================================================================

  static async exportToExcel(req, res, next) {
    try {
      const payments = await paymentRepository.findAll();

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Pilates Phenikaa';
      const sheet = workbook.addWorksheet('Doanh thu phòng tập');

      sheet.columns = [
        { header: 'ID Giao dịch', key: 'id', width: 12 },
        { header: 'Khách hàng', key: 'full_name', width: 25 },
        { header: 'Số điện thoại', key: 'phone', width: 15 },
        { header: 'Số tiền (VNĐ)', key: 'amount', width: 18 },
        { header: 'Loại Giao dịch', key: 'payment_type', width: 18 },
        { header: 'Trạng thái', key: 'status', width: 15 },
        { header: 'Ngày tạo', key: 'created_at', width: 18 },
      ];

      const headerRow = sheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B4332' } };
      });

      payments.forEach((p) => {
        sheet.addRow({
          id: p.id,
          full_name: p.full_name,
          phone: p.phone,
          amount: p.amount,
          payment_type: p.payment_type === 'month_package' ? 'Gói tháng' : 'Vé ngày',
          status: p.status === 'paid' ? 'Đã thanh toán' : p.status === 'pending' ? 'Chờ duyệt' : 'Đã hủy/Hoàn tiền',
          created_at: new Date(p.created_at).toLocaleDateString('vi-VN'),
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=' + `DoanhThu_Pilates_Phenikaa_${Date.now()}.xlsx`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AdminController;