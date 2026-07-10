const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/checkin.controller');
const { requireAdminOrStaff } = require('../middleware/admin.middleware');

router.get('/', requireAdminOrStaff, ctrl.index);
router.get('/history', requireAdminOrStaff, ctrl.history);
router.get('/history/export', requireAdminOrStaff, ctrl.exportHistory);
router.post('/by-code', requireAdminOrStaff, ctrl.doCheckinByCode);
router.post('/', requireAdminOrStaff, ctrl.doCheckin);
router.post('/:id/checkout', requireAdminOrStaff, ctrl.doCheckout);

module.exports = router;
