/**
 * member.controller.js
 * ------------------------------------------------------------------
 * Controller đóng gói các hành động dành riêng cho phân hệ Hội viên (Member).
 * Điều phối Req/Res, gọi sang tầng Service (classService, packageService).
 * Tuân thủ nguyên tắc Đóng gói (OOP Class) và đồng bộ CHỮ THƯỜNG cho status/role.
 * ------------------------------------------------------------------
 */

const classService = require('../services/class.service');
const packageService = require('../services/package.service');

class MemberController {

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

  /**
   * GET /member/dashboard — Trang tổng quan cá nhân của Hội viên (R0.5)
   */
  static async showDashboard(req, res, next) {
    try {
      const user = req.session.user;
      const classes = await classService.listClasses();
      const myBookings = await classService.myClasses(user.id);

      res.render('member/dashboard', {
        title: 'Tổng quan cá nhân',
        user,
        classes,
        stats: {
          myBookingsCount: myBookings.length
        },
        ...MemberController._popFlash(req)
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /member/classes — Xem lịch phòng tập trực quan theo tuần (R5.3, R5.6)
   */
  static async showClasses(req, res, next) {
    try {
      const classes = await classService.listClasses();
      res.render('member/classes', {
        title: 'Lịch học Pilates',
        user: req.session.user,
        classes,
        ...MemberController._popFlash(req)
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /member/classes/:id/register — Hội viên đăng ký đặt ca học (R5.3)
   */
  static async registerClass(req, res, next) {
    try {
      const classId = req.params.id;
      const userId = req.session.user.id;

      const result = await classService.registerForClass(classId, userId);

      if (result.success) {
        req.session.flash_success = result.message;
      } else {
        req.session.flash_error = result.message;
      }

      res.redirect('/member/classes');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /member/bookings — Quản lý lịch sử đặt ca và tập luyện (R1.5, R2.5)
   */
  static async showMyBookings(req, res, next) {
    try {
      const userId = req.session.user.id;
      const myClasses = await classService.myClasses(userId);
      
      res.render('member/my-bookings', {
        title: 'Lịch sử đặt ca & Tập luyện',
        user: req.session.user,
        myClasses,
        ...MemberController._popFlash(req)
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /member/classes/:id/cancel-booking — Hội viên chủ động hủy lịch đặt ca học (R1.5)
   */
  static async cancelBooking(req, res, next) {
    try {
      const classId = req.params.id;
      const userId = req.session.user.id;

      const result = await classService.cancelBooking(classId, userId);

      if (result.success) {
        req.session.flash_success = result.message;
      } else {
        req.session.flash_error = result.message;
      }

      res.redirect('/member/bookings');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /member/packages — Xem danh mục các gói tháng và vé ngày (R2.3)
   */
  static async showPackages(req, res, next) {
    try {
      const packages = await packageService.getAllPackages();
      res.render('member/packages', {
        title: 'Danh sách Gói tập',
        user: req.session.user,
        packages,
        ...MemberController._popFlash(req)
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /member/packages/register — Hội viên tự đăng ký mua gói tập trực tuyến (R2.3)
   */
  static async registerPackage(req, res, next) {
    try {
      const { packageId } = req.body;
      const userId = req.session.user.id;

      const result = await packageService.registerMonthlyPackage(userId, packageId);

      req.session.flash_success = result.message;
      res.redirect('/member/packages');
    } catch (err) {
      req.session.flash_error = err.message;
      res.redirect('/member/packages');
    }
  }
}

module.exports = MemberController;