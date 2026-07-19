const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reports.controller');
const Auth = require('../middleware/auth.middleware');

router.get('/', Auth.role('admin'), ctrl.index);
router.get('/export/finance', Auth.role('admin'), ctrl.exportFinanceExcel);

module.exports = router;
