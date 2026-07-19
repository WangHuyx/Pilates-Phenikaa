# Pilates Phenikaa

Đây là khung ứng dụng Node.js + Express dành cho trang web đăng ký lớp tập Pilates.

## Tài khoản đăng nhập

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

## Cấu trúc thư mục


Các tầng phụ thuộc:

```
routes -> controllers -> services -> repositories
```

## Hướng dẫn kết nối MySQL Database

Dự án hiện tại đã được cấu hình để kết nối với cơ sở dữ liệu MySQL bằng thư viện `mysql2`.

Các bước thiết lập:

1. **Import Database:**
   - Tạo một cơ sở dữ liệu tên là `pilates_db` trong MySQL của bạn (thông qua phpMyAdmin, XAMPP, DBeaver, v.v.).
   - Import file `pilates_db.sql` vào cơ sở dữ liệu vừa tạo. File này chứa toàn bộ cấu trúc bảng và một số dữ liệu mẫu (đã bao gồm các bảng `classes` tương thích với cấu trúc của ứng dụng).
2. **Cấu hình môi trường (.env):**
   - Đảm bảo dự án có file `.env` ở thư mục gốc. Nếu chưa có, hãy tạo mới dựa trên nội dung sau:
     ```env
     # SERVER
     PORT=3000
     SESSION_SECRET=Huynguyen_726

     # DATABASE
     DB_HOST=localhost
     DB_PORT=3306
     DB_USER=root
     DB_PASSWORD=
     DB_NAME=pilates_db
     ```
   - Điều chỉnh `DB_PASSWORD` (hoặc `DB_USER`) cho khớp với cấu hình MySQL trên máy của bạn.
3. **Chạy ứng dụng:**
   - Chạy lệnh `npm run dev` (hoặc `npm start`). Nếu Terminal in ra dòng chữ `Đã kết nối tới cơ sở dữ liệu MySQL (pilates_db)` thì ứng dụng đã kết nối thành công.

## Notes

- Mật khẩu được băm bằng `bcryptjs`, nhờ đó mã xác thực được thiết kế theo cách tương tự như khi làm việc với cơ sở dữ liệu thực tế (không bao giờ so sánh mật khẩu dạng văn bản thuần).
- Cơ chế lưu trữ phiên (session store) mặc định của Express hoạt động trên bộ nhớ (in-memory) — phù hợp cho quá trình phát triển cục bộ, nhưng không thích hợp cho môi trường triển khai thực tế (production) hoặc hệ thống có nhiều instance máy chủ (xem mục 5 ở trên).
