/**
 * server.js
 * ------------------------------------------------------------------
 * Điểm khởi chạy. Chạy bằng lệnh `npm start` (hoặc `npm run dev` để
 * tự động khởi động lại thông qua nodemon).
 * ------------------------------------------------------------------
 */

const app = require('./app');
// require('dotenv').config();
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Pilates Phenikaa app running at http://localhost:${port}`);
  console.log('username: admin | password: Pilates@123');
});
