const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/package/package.controller');
const Auth = require('../../middleware/auth.middleware');

router.get('/', Auth.role('admin', 'staff', 'member'), ctrl.index);
router.post('/buy', Auth.role('member'), ctrl.buyPackage);
router.post('/', Auth.role('admin', 'staff'), ctrl.createPackage);
router.post('/:id/update', Auth.role('admin', 'staff'), ctrl.updatePackage);
router.post('/:id/delete', Auth.role('admin', 'staff'), ctrl.deletePackage);
router.post('/assign', Auth.role('admin', 'staff'), ctrl.assignPackage);
router.post('/membership/:id/delete', Auth.role('admin', 'staff'), ctrl.deleteMembership);

module.exports = router;