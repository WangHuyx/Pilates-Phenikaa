const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/package.controller');
const Auth = require('../middleware/auth.middleware');

router.get('/', Auth.role('admin', 'member'), ctrl.index);
router.post('/buy', Auth.role('member'), ctrl.buyPackage);
router.post('/', Auth.role('admin'), ctrl.createPackage);
router.post('/:id/update', Auth.role('admin'), ctrl.updatePackage);
router.post('/:id/delete', Auth.role('admin'), ctrl.deletePackage);
router.post('/assign', Auth.role('admin'), ctrl.assignPackage);
router.post('/membership/:id/delete', Auth.role('admin'), ctrl.deleteMembership);

module.exports = router;