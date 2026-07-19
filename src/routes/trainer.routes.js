const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/trainer.controller');
const Auth = require('../middleware/auth.middleware');

router.get('/', Auth.requiredlogin, ctrl.index);
router.get('/:id/edit', Auth.role('admin'), ctrl.showEdit);
router.post('/create', Auth.role('admin'), ctrl.create);
router.post('/:id/update', Auth.role('admin'), ctrl.update);
router.post('/:id/delete', Auth.role('admin'), ctrl.remove);

module.exports = router;
