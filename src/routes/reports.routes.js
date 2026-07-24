const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reports.controller');
const Auth = require('../middleware/auth.middleware');

router.get('/', Auth.permission('report.view'), ctrl.index);
router.get('/export/finance', Auth.permission('finance.invoice'), ctrl.exportFinanceExcel);

module.exports = router;
