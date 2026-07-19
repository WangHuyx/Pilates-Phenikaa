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
require('dotenv').config();

const indexRoutes = require('./routes/index.routes');
const authRoutes = require('./routes/auth.routes');
const classRoutes = require('./routes/class/class.routes');
const accountRoutes  = require('./routes/account.routes');
const employeeRoutes = require('./routes/employee.routes');
const packageRoutes   = require('./routes/package/package.routes');
const financeRoutes   = require('./routes/finance.routes');
const reportsRoutes   = require('./routes/reports.routes');
const trainerRoutes     = require('./routes/trainer.routes');
const equipmentRoutes   = require('./routes/equipment.routes');
const permissionsRoutes = require('./routes/permissions.routes');
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
const sessionSecret = process.env.SESSION_SECRET || 'Huynguyen_726';
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 2 }, // 2 hours
  })
);

// --- Routes ------------------------------------------------------------
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/', classRoutes);
app.use('/accounts',  accountRoutes);
app.use('/employees', employeeRoutes);
app.use('/packages',  packageRoutes);
app.use('/finance',   financeRoutes);
app.use('/reports',   reportsRoutes);
app.use('/trainers',     trainerRoutes);
app.use('/equipment',   equipmentRoutes);
app.use('/permissions', permissionsRoutes);

// --- Catch-alls (must be registered last) -------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
