const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/payroll.controller');
const { requireAdmin } = require('../middleware/admin.middleware');

router.get('/',                       requireAdmin, ctrl.index);
router.get('/attendance/:type/:id',   requireAdmin, ctrl.attendanceDetail);
router.post('/attendance',            requireAdmin, ctrl.markAttendance);
router.post('/calculate',             requireAdmin, ctrl.calculatePayroll);
router.post('/:id/status',            requireAdmin, ctrl.updateStatus);
router.post('/:id/delete',            requireAdmin, ctrl.deletePayroll);

module.exports = router;
