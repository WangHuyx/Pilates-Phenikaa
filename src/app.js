/**
 * app.js
 * ------------------------------------------------------------------
 * Tạo và cấu hình đối tượng ứng dụng Express. Việc tách biệt khỏi server.js
 * giúp ứng dụng có thể được import vào các bài kiểm thử (test) sau này
 * mà không cần thực sự khởi chạy trình lắng nghe mạng.
 * ------------------------------------------------------------------
 */

const path = require('path');
const express = require('express');
const session = require('express-session');
const config = require('./config/config');

const indexRoutes = require('./routes/index.routes');
const authRoutes = require('./routes/auth.routes');
const classRoutes = require('./routes/class.routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

const app = express();

// --- View engine -----------------------------------------------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- Core middleware ---------------------------------------------------
app.use(express.urlencoded({ extended: true })); // parses <form> POST bodies
app.use(express.json()); // parses JSON bodies (handy if you add an API later)
app.use(express.static(path.join(__dirname, '..', 'public'))); // CSS/images

// --- Session ---------------------------------------------------------
// NOTE: the default MemoryStore used here is fine for local development
// only — it leaks memory and won't scale across multiple server
// instances. When you add a real database, swap in a matching session
// store, e.g. `connect-mongo` (MongoDB) or `connect-pg-simple` (Postgres).
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 2 }, // 2 hours
  })
);

// --- Routes ------------------------------------------------------------
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/', classRoutes);

// --- Catch-alls (must be registered last) -------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
