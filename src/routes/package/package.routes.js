const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/package/package.controller');
const Auth = require('../../middleware/auth.middleware');

// member luôn được xem/mua gói (không thuộc quyền quản lý gói tập của staff);
// staff chỉ được vào nếu admin đã cấp package.view/package.manage ở trang Phân quyền.
router.get('/', Auth.permission('package.view', ['member']), ctrl.index);
router.post('/buy', Auth.role('member'), ctrl.buyPackage);
router.post('/', Auth.permission('package.manage'), ctrl.createPackage);
router.post('/:id/update', Auth.permission('package.manage'), ctrl.updatePackage);
router.post('/:id/delete', Auth.permission('package.manage'), ctrl.deletePackage);
router.post('/assign', Auth.permission('package.manage'), ctrl.assignPackage);
router.post('/membership/:id/delete', Auth.permission('package.manage'), ctrl.deleteMembership);

module.exports = router;