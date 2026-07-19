const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/equipment.controller');
const Auth = require('../middleware/auth.middleware');

router.get('/', Auth.role('admin', 'staff'), ctrl.index);
router.post('/create', Auth.role('admin', 'staff'), ctrl.create);
router.post('/:id/update', Auth.role('admin', 'staff'), ctrl.update);
router.post('/:id/delete', Auth.role('admin', 'staff'), ctrl.remove);

module.exports = router;
