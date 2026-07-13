const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/employee.controller');
const { requireAdmin } = require('../middleware/admin.middleware');

router.get('/:id/edit',               ctrl.showEdit);

router.use(requireAdmin);

router.get('/',                        ctrl.index);
router.post('/create',                 ctrl.create);
router.post('/:id/update',            ctrl.update);
router.post('/:id/delete',            ctrl.delete);

module.exports = router;
