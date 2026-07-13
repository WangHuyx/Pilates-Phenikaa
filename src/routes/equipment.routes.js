const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/equipment.controller');
const { requireAdminOrStaff } = require('../middleware/admin.middleware');

router.get('/', requireAdminOrStaff, ctrl.index);
router.post('/create', requireAdminOrStaff, ctrl.create);
router.post('/:id/update', requireAdminOrStaff, ctrl.update);
router.post('/:id/delete', requireAdminOrStaff, ctrl.remove);

module.exports = router;
