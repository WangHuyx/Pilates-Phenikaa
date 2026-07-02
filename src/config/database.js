/**
 * database.js
 * ------------------------------------------------------------------
 * Cấu hình kết nối cơ sở dữ liệu MySQL sử dụng Connection Pool.
 * ------------------------------------------------------------------
 */

const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pilates_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Kiểm tra kết nối khi khởi động
pool.getConnection()
  .then(connection => {
    console.log('✅ Đã kết nối tới cơ sở dữ liệu MySQL (pilates_db)');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Lỗi kết nối CSDL:', err.message);
  });

module.exports = pool;
