// routes/account.routes.js
const express        = require('express');
const router         = express.Router();
const AccountCtrl    = require('../controllers/account.controller');
const Auth = require('../middleware/auth.middleware');

// Tất cả route trong file này yêu cầu đăng nhập
router.use(Auth.requiredlogin);
router.get('/:id/edit',       AccountCtrl.showEdit); // Hồ sơ cá nhân — mọi vai trò

// Quyền xem/thêm/sửa/xóa hội viên do trang /permissions cấu hình thật cho từng
// vai trò (bảng role_permissions) — admin luôn được đi qua. Đổi vai trò tài
// khoản không có ô quyền tương ứng trên trang Phân quyền nên vẫn khóa cứng
// admin-only (rủi ro leo quyền cao, không nên để cấu hình qua UI).
router.get('/',               Auth.permission('member.view'),   AccountCtrl.index);
router.get('/:id/history',    Auth.permission('member.view'),   AccountCtrl.history);
router.post('/create',        Auth.permission('member.add'),    AccountCtrl.create);
router.post('/:id/update',    Auth.permission('member.edit'),   AccountCtrl.update);
router.post('/:id/delete',    Auth.permission('member.delete'), AccountCtrl.delete);
router.post('/:id/role',      Auth.role('admin'),               AccountCtrl.changeRole);

module.exports = router;