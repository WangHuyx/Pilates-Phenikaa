const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/trainer.controller');
const Auth = require('../middleware/auth.middleware');

router.get('/', Auth.requiredlogin, ctrl.index); // Danh sách HLV: mọi người đã đăng nhập đều xem được (không thuộc quyền nhân sự)
router.get('/:id/edit', Auth.permission('staff.view'), ctrl.showEdit);
router.post('/create', Auth.permission('staff.manage'), ctrl.create);
router.post('/:id/update', Auth.permission('staff.manage'), ctrl.update);
router.post('/:id/delete', Auth.permission('staff.manage'), ctrl.remove);

module.exports = router;
