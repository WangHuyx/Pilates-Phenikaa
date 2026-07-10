const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/finance.controller');
const { requireAdminOrStaff } = require('../middleware/admin.middleware');

router.get('/', requireAdminOrStaff, ctrl.index);
router.post('/', requireAdminOrStaff, ctrl.createPayment);
router.post('/:id/delete', requireAdminOrStaff, ctrl.deletePayment);

module.exports = router;
