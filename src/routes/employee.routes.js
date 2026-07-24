const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/employee.controller');
const Auth = require('../middleware/auth.middleware');

// FIX: trước đây route này không có bất kỳ guard nào (kể cả yêu cầu đăng nhập) —
// ai cũng xem được form sửa nhân sự. Quyền xem/quản lý nhân sự giờ do trang
// /permissions cấu hình thật qua bảng role_permissions (admin luôn được đi qua).
router.get('/:id/edit',      Auth.permission('staff.view'),   ctrl.showEdit);
router.get('/',              Auth.permission('staff.view'),   ctrl.index);
router.post('/create',       Auth.permission('staff.manage'), ctrl.create);
router.post('/:id/update',   Auth.permission('staff.manage'), ctrl.update);
router.post('/:id/delete',   Auth.permission('staff.manage'), ctrl.delete);

module.exports = router;
