const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/package.controller');
const { requireAdminOrStaff } = require('../middleware/admin.middleware');

router.get('/', requireAdminOrStaff, ctrl.index);
router.post('/', requireAdminOrStaff, ctrl.createPackage);
router.post('/:id/update', requireAdminOrStaff, ctrl.updatePackage);
router.post('/:id/delete', requireAdminOrStaff, ctrl.deletePackage);
router.post('/assign', requireAdminOrStaff, ctrl.assignPackage);
router.post('/membership/:id/delete', requireAdminOrStaff, ctrl.deleteMembership);

module.exports = router;
