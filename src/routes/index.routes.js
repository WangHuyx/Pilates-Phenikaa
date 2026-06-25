/**
 * index.routes.js — khởi động ứng dụng, chuyển hướng đến /dashboard nếu đã đăng nhập hoặc /login nếu chưa đăng nhập.
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.redirect(req.session.user ? '/dashboard' : '/login');
});

module.exports = router;
