const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/finance.controller');
const Auth = require('../middleware/auth.middleware');

router.get('/', Auth.role('admin', 'staff'), ctrl.index);
router.post('/', Auth.role('admin', 'staff'), ctrl.createPayment);
router.post('/:id/delete', Auth.role('admin', 'staff'), ctrl.deletePayment);

module.exports = router;
