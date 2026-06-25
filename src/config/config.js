/**
 * config.js
 * ------------------------------------------------------------------
 * Khi bạn thêm một cơ sở dữ liệu thực, chuỗi kết nối của nó cũng sẽ
 * đọc tại đây, ví dụ:
 *   dbUrl: process.env.DATABASE_URL || 'mongodb://localhost:27017/pilates'
 * ------------------------------------------------------------------
 */

// Tải các biến từ tệp ".env" cục bộ (nếu có) vào process.env.
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  sessionSecret: process.env.SESSION_SECRET || 'Huynguyen_726',
};
