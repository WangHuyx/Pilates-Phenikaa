const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/employee.controller');
const { requireAdmin } = require('../middleware/admin.middleware');

router.use(requireAdmin);

router.get('/',                        ctrl.index);
router.post('/create',                 ctrl.create);
router.get('/schedule',                ctrl.schedule);
router.post('/schedule/assign',        ctrl.assignShift);
router.post('/schedule/:id/delete',    ctrl.deleteShift);
router.get('/:id/edit',               ctrl.showEdit);
router.post('/:id/update',            ctrl.update);
router.post('/:id/delete',            ctrl.delete);

module.exports = router;
