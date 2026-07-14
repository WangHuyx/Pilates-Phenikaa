const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reports.controller');
const { requireAdmin } = require('../middleware/admin.middleware');

router.get('/', requireAdmin, ctrl.index);
router.get('/export/finance', requireAdmin, ctrl.exportFinanceExcel);

module.exports = router;
