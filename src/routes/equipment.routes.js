const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/equipment.controller');
const { requireAdminOrStaff } = require('../middleware/admin.middleware');

router.get('/', requireAdminOrStaff, ctrl.index);
router.post('/create', requireAdminOrStaff, ctrl.create);
router.post('/:id/update', requireAdminOrStaff, ctrl.update);
router.post('/:id/delete', requireAdminOrStaff, ctrl.remove);
router.post('/maintenance/create', requireAdminOrStaff, ctrl.createLog);
router.post('/maintenance/:id/complete', requireAdminOrStaff, ctrl.completeLog);
router.post('/maintenance/:id/delete', requireAdminOrStaff, ctrl.deleteLog);

module.exports = router;
