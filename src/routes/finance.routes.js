const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/finance.controller');
const Auth = require('../middleware/auth.middleware');

router.get('/', Auth.permission('finance.view'), ctrl.index);
router.post('/', Auth.permission('finance.manage'), ctrl.createPayment);
router.post('/:id/delete', Auth.permission('finance.manage'), ctrl.deletePayment);

module.exports = router;
