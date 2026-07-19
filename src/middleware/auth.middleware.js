/**
 * auth.middleware.js
 * ------------------------------------------------------------------
* Route guard: chặn quyền truy cập vào các trang được bảo vệ.
 * ------------------------------------------------------------------
 */

class Auth {
  /** 
   * Bắt buộc đăng nhập — trả về 401 nếu chưa có session 
   * Sử dụng: router.get('/profile', Auth.required, controller)
   */
  static requiredlogin(req, res, next) {
      if (req.session && req.session.user) {
        return next();
      }
      return res.redirect('/login');
  }

  /**
   * Kiểm tra vai trò — trả về 403 nếu không đủ quyền
   * Sử dụng: router.get('/dashboard', Auth.role('admin', 'staff'), controller)
   */
  static role(...roles) {
    return (req, res, next) => {
      // Gọi lại logic check required
      if (!req.session || !req.session.user) {
        return res.status(401).render('error', {
          title: 'Lỗi xác thực',
          message: 'Vui lòng đăng nhập.',
          currentUser: null
        });
      }

      const userRole = req.session.user.role;
      
      // Kiểm tra mảng roles có chứa quyền của user hiện tại không
      if (!roles.includes(userRole)) {
        return res.status(403).render('error', {
          title: 'Không có quyền',
          message: 'Bạn không có quyền thực hiện thao tác này.',
          currentUser: req.session.user
        });
      }
      
      next();
    };
  }

  /** 
   * Kiểm tra người dùng hiện tại có sở hữu tài nguyên không 
   * Gợi ý: ownerIdKey là tên tham số (vd: 'id' trong req.params.id)
   * Sử dụng: router.put('/post/:authorId', Auth.owns('authorId'), controller)
   */
  static owns(ownerIdKey) {
    return (req, res, next) => {
      if (!req.session || !req.session.user) {
        return res.status(401).send('Unauthorized');
      }

      const uid = req.session.user.id;
      const role = req.session.user.role;
      
      // Lấy ID chủ sở hữu từ URL param (hoặc body tuỳ thiết kế)
      const ownerId = req.params[ownerIdKey]; 

      // Nếu không phải chủ sở hữu và không phải admin -> block
      if (String(uid) !== String(ownerId) && role !== 'admin') {
        return res.status(403).render('error', {
          title: 'Không có quyền',
          message: 'Bạn không có quyền chỉnh sửa tài nguyên này.',
          currentUser: req.session.user
        });
      }
      
      next();
    };
  }
}

module.exports = Auth;