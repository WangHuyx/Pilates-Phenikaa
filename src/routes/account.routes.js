// routes/account.routes.js
const express        = require('express');
const router         = express.Router();
const AccountCtrl    = require('../controllers/account.controller');
const Auth = require('../middleware/auth.middleware');

// Tất cả route trong file này yêu cầu đăng nhập
router.use(Auth.requiredlogin);
router.get('/:id/edit',       AccountCtrl.showEdit); // Hồ sơ cá nhân — mọi vai trò

// Admin + Staff: xem/thêm/sửa hội viên (staff chỉ thấy & tạo được tài khoản role=member,
// xem account.controller.js). Xóa tài khoản và đổi vai trò vẫn chỉ dành cho Admin.
router.get('/',               Auth.role('admin', 'staff'), AccountCtrl.index);
router.get('/:id/history',    Auth.role('admin', 'staff'), AccountCtrl.history);
router.post('/create',        Auth.role('admin', 'staff'), AccountCtrl.create);
router.post('/:id/update',    Auth.role('admin', 'staff'), AccountCtrl.update);

router.use(Auth.role('admin'));
router.post('/:id/delete',    AccountCtrl.delete);
router.post('/:id/role',      AccountCtrl.changeRole);

module.exports = router;