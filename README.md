# Pilates Phenikaa — booking app starter

Đây là khung ứng dụng Node.js + Express dành cho trang web đăng ký lớp học Pilates.

## Tài khoản đăng nhập demo

```
username: admin
password: Pilates@123
```

## hướng dẫn chạy dự án trên máy local

```bash
npm install
npm run dev # or: npm start
```

Mở trình duyệt và gõ `http://localhost:3000`.

## Một số trang:

- `/login` — Đăng nhập
- `/dashboard` — Trang chính
- `/classes` — Đăng kí lớp học
- `/my-bookings` — Quản lí lớp học người dùng đã đăng kí
- `/logout` — clears the session

## Project layout

```
src/
  config/         Nơi cấu hình môi trường kết nối (port,sessionSecret,database)
  data/           Dữ liệu giả định, có thể bỏ sau khi có CSDL
  repositories/   Nơi thực hiện truy vấn dữ liệu từ CSDL
  services/       Xử lí các logic nghiệp vụ thông qua việc gọi các function trong `repositories/`.
  controllers/    Xử lý việc điều phối yêu cầu/phản hồi.
  routes/         ánh xạ các URL và phương thức HTTP tới các hàm của controller
  middleware/     Xử lí UX (requireLogin guard, 404 + error handlers)
  views/          Giao diện tương tác
  public/css/     Thiết kế, định dạng và trang ttự rí giao diện(views/)
```

Các tầng phụ thuộc:

```
routes -> controllers -> services -> repositories -> data
```

## Hướng dẫn kết nối datase

Mục đích chính của thư mục `repositories/` là đóng vai trò là điểm kết nối duy nhất để thay đổi cơ chế lưu trữ. Không có thành phần nào trong `controllers/` hay `services/` thực hiện import trực tiếp từ `data/` — chúng chỉ gọi các hàm như `userRepository.findByUsername(...)`.

Hướng dẫn thêm database:

1. Chọn một cơ sở dữ liệu + driver/ORM (ví dụ: MongoDB + Mongoose, hoặc PostgreSQL + Prisma/knex).
2. Cấu hình kết nối `src/config/config.js`.
3. Mở `src/repositories/`
   Viết các function truy vấn; Các truy vấn kiểu SQL và Mongoose để bắt đầu.
4. Xóa `src/data/users.data.js` and `src/data/classes.data.js` - không còn dùng.
5. Nếu bạn chuyển các phiên làm việc để chạy trên nhiều phiên bản máy chủ, hãy thay thế kho lưu trữ phiên mặc định trong bộ nhớ ở `src/app.js` bằng kho lưu trữ được hỗ trợ bởi cơ sở dữ liệu của bạn
(ví dụ: `connect-mongo` hoặc `connect-pg-simple`).

Routes, controllers, services, and views stay untouched.

## Notes

- Mật khẩu được băm bằng `bcryptjs`, nhờ đó mã xác thực được thiết kế theo cách tương tự như khi làm việc với cơ sở dữ liệu thực tế (không bao giờ so sánh mật khẩu dạng văn bản thuần).
- Cơ chế lưu trữ phiên (session store) mặc định của Express hoạt động trên bộ nhớ (in-memory) — phù hợp cho quá trình phát triển cục bộ, nhưng không thích hợp cho môi trường triển khai thực tế (production) hoặc hệ thống có nhiều instance máy chủ (xem mục 5 ở trên).
