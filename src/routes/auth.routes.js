/**
 * auth.routes.js — các tuyến đường liên quan đến xác thực người dùng (đăng nhập, đăng xuất).
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.get('/login', authController.showLoginForm);
router.post('/login', authController.handleLogin);
router.get('/logout', authController.handleLogout);

module.exports = router;
