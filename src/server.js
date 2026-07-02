/**
 * server.js
 * ------------------------------------------------------------------
 * Điểm khởi chạy. Chạy bằng lệnh `npm start` (hoặc `npm run dev` để
 * tự động khởi động lại thông qua nodemon).
 * ------------------------------------------------------------------
 */

const app = require('./app');
const config = require('./config/config');

app.listen(config.port, () => {
  console.log(`Pilates Phenikaa app running at http://localhost:${config.port}`);
  console.log('username: admin | password: admin123');
});
