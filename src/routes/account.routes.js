// routes/account.routes.js
const express        = require('express');
const router         = express.Router();
const AccountCtrl    = require('../controllers/account.controller');
const { requireLogin } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');

// Tất cả route trong file này yêu cầu đăng nhập + là Admin
router.use(requireLogin);
router.get('/:id/edit',       AccountCtrl.showEdit);
router.use(requireAdmin);
router.get('/',               AccountCtrl.index);
router.get('/:id/history',    AccountCtrl.history);
router.post('/create',        AccountCtrl.create);
router.post('/:id/update',    AccountCtrl.update);
router.post('/:id/delete',    AccountCtrl.delete);
router.post('/:id/role',      AccountCtrl.changeRole);

module.exports = router;