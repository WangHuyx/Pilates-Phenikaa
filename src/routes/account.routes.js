// routes/account.routes.js
const express        = require('express');
const router         = express.Router();
const AccountCtrl    = require('../controllers/account.controller');
const { requireLogin } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');

// Tất cả route trong file này yêu cầu đăng nhập + là Admin
router.use(requireLogin, requireAdmin);

router.get('/',               AccountCtrl.index);      // Danh sách tài khoản
router.get('/:id/edit',       AccountCtrl.showEdit);   // Form chỉnh sửa
router.post('/create',        AccountCtrl.create);     // Tạo mới
router.post('/:id/update',    AccountCtrl.update);     // Cập nhật
router.post('/:id/delete',    AccountCtrl.delete);     // Xóa
router.post('/:id/role',      AccountCtrl.changeRole); // Phân quyền

module.exports = router;