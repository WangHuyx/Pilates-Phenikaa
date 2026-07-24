const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/equipment.controller');
const Auth = require('../middleware/auth.middleware');

router.get('/', Auth.permission('equipment.view'), ctrl.index);
router.post('/create', Auth.permission('equipment.manage'), ctrl.create);
router.post('/:id/update', Auth.permission('equipment.manage'), ctrl.update);
router.post('/:id/delete', Auth.permission('equipment.manage'), ctrl.remove);

module.exports = router;
