const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/trainer.controller');
const { requireLogin } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');

router.get('/', requireLogin, ctrl.index);
router.get('/:id/edit', requireAdmin, ctrl.showEdit);
router.post('/create', requireAdmin, ctrl.create);
router.post('/:id/update', requireAdmin, ctrl.update);
router.post('/:id/delete', requireAdmin, ctrl.remove);

module.exports = router;
