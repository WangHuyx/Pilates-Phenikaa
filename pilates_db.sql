-- =============================================
-- PILATES STUDIO MANAGEMENT SYSTEM DATABASE
-- Phiên bản: 2.0 (đã sửa lỗi và bổ sung)
-- =============================================

DROP DATABASE IF EXISTS pilates_db;
CREATE DATABASE pilates_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pilates_db;

-- =============================================
-- 1. ROLES TABLE
-- =============================================
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FIX: Thêm role 'trainer' (3) và 'member' (4) — trước chỉ có admin và staff
INSERT INTO roles (name, description) VALUES
('admin',   'Quản trị viên hệ thống'),
('staff',   'Nhân viên phòng tập'),
('trainer', 'Huấn luyện viên'),
('member',  'Hội viên');

-- =============================================
-- 2. USERS TABLE
-- =============================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar VARCHAR(255),
    role_id INT NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role_id);

-- FIX: Comment sửa từ 'admin123' → 'Pilates@123' (hash bên dưới là của Pilates@123)
-- FIX: Thêm tài khoản đăng nhập cho Trainers (role_id=3) và Members (role_id=4)
-- Mapping id sau khi insert: 1=admin, 2=staff1, 3=bich.tran, 4=cuong.le, 5=dung.pham
--                            6=huong.nguyen, 7=minh.tran, 8=nga.le, 9=phuc.pham, 10=quynh.hoang
INSERT INTO users (username, password, email, full_name, phone, role_id) VALUES
('admin',        '$2a$10$4Qde18CSOol2M4hAvqja1O9pdGuWiVGUeA2XFFcq6V5lSLkyw8bcC', 'admin@pilates.com',      'Administrator',     '0901234567', 1),
('staff1',       '$2a$10$4Qde18CSOol2M4hAvqja1O9pdGuWiVGUeA2XFFcq6V5lSLkyw8bcC', 'staff1@pilates.com',     'Nguyễn Văn A',      '0901234568', 2),
('bich.tran',    '$2a$10$4Qde18CSOol2M4hAvqja1O9pdGuWiVGUeA2XFFcq6V5lSLkyw8bcC', 'bich.tran@pilates.com',  'Trần Thị Bích',     '0912345001', 3),
('cuong.le',     '$2a$10$4Qde18CSOol2M4hAvqja1O9pdGuWiVGUeA2XFFcq6V5lSLkyw8bcC', 'cuong.le@pilates.com',   'Lê Văn Cường',      '0912345002', 3),
('dung.pham',    '$2a$10$4Qde18CSOol2M4hAvqja1O9pdGuWiVGUeA2XFFcq6V5lSLkyw8bcC', 'dung.pham@pilates.com',  'Phạm Thị Dung',     '0912345003', 3),
('huong.nguyen', '$2a$10$4Qde18CSOol2M4hAvqja1O9pdGuWiVGUeA2XFFcq6V5lSLkyw8bcC', 'huong.nguyen@email.com', 'Nguyễn Thị Hương',  '0987654001', 4),
('minh.tran',    '$2a$10$4Qde18CSOol2M4hAvqja1O9pdGuWiVGUeA2XFFcq6V5lSLkyw8bcC', 'minh.tran@email.com',    'Trần Văn Minh',     '0987654002', 4),
('nga.le',       '$2a$10$4Qde18CSOol2M4hAvqja1O9pdGuWiVGUeA2XFFcq6V5lSLkyw8bcC', 'nga.le@email.com',       'Lê Thị Nga',        '0987654003', 4),
('phuc.pham',    '$2a$10$4Qde18CSOol2M4hAvqja1O9pdGuWiVGUeA2XFFcq6V5lSLkyw8bcC', 'phuc.pham@email.com',    'Phạm Văn Phúc',     '0987654004', 4),
('quynh.hoang',  '$2a$10$4Qde18CSOol2M4hAvqja1O9pdGuWiVGUeA2XFFcq6V5lSLkyw8bcC', 'quynh.hoang@email.com',  'Hoàng Thị Quỳnh',   '0987654005', 4);

-- =============================================
-- 3. MEMBERS TABLE
-- =============================================
CREATE TABLE members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    member_code VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other') DEFAULT 'female',
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    join_date DATE DEFAULT (CURRENT_DATE),
    status ENUM('active', 'inactive', 'expired') DEFAULT 'active',
    avatar VARCHAR(255),
    notes TEXT,
    user_id INT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX idx_members_code ON members(member_code);
CREATE INDEX idx_members_name ON members(full_name);
CREATE INDEX idx_members_phone ON members(phone);
CREATE INDEX idx_members_status ON members(status);

-- =============================================
-- 4. TRAINERS TABLE
-- =============================================
CREATE TABLE trainers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    trainer_code VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    specialization VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(100),
    salary DECIMAL(12, 2) DEFAULT 0,
    avatar VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    hire_date DATE DEFAULT (CURRENT_DATE),
    user_id INT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX idx_trainers_code ON trainers(trainer_code);
CREATE INDEX idx_trainers_name ON trainers(full_name);

-- =============================================
-- 5. STAFFS TABLE
-- =============================================
CREATE TABLE staffs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    staff_code VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(100) COMMENT 'Chức danh/vị trí công việc, vd: Lễ tân, Kế toán',
    -- FIX: Đã thêm 2 cột 'department' và 'start_date' để khớp với requirements của Backend (employee.repository.js)
    department VARCHAR(100),
    start_date DATE,
    salary DECIMAL(12, 2) DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX idx_staffs_code ON staffs(staff_code);

-- =============================================
-- 6. COURSES TABLE
-- =============================================
CREATE TABLE courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    duration INT COMMENT 'Duration in minutes per session',
    price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_sessions INT DEFAULT 1,
    trainer_id INT,
    image VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX idx_courses_code ON courses(course_code);
CREATE INDEX idx_courses_name ON courses(name);
CREATE INDEX idx_courses_trainer ON courses(trainer_id);

-- =============================================
-- 7. PACKAGES TABLE
-- NOTE: bảng này không được module Gói tập của ứng dụng sử dụng
-- (xem src/repositories/package.repository.js) — giữ lại để tương thích
-- ngược, gói tập thực tế nằm ở bảng membership_packages bên dưới.
-- =============================================
CREATE TABLE packages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    type ENUM('monthly', 'quarterly', 'yearly') NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    duration_days INT NOT NULL,
    discount DECIMAL(5, 2) DEFAULT 0 COMMENT 'Discount percentage',
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- NOTE:AI không sửa hàm này.Đây là bảng cố định chung
CREATE TABLE membership_packages (
id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price INT NOT NULL,                          -- Lưu số nguyên, tương ứng với parseInt ở Backend
    duration_days INT NOT NULL,                  -- Lưu số nguyên, tương ứng với parseInt ở Backend
    description TEXT DEFAULT NULL,             -- Mặc định là NULL nếu không truyền vào
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- NOTE:AI không sửa hàm này.Đây là bảng cố định chung
CREATE TABLE user_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    package_id INT NOT NULL,
    price_paid INT NOT NULL,                    -- Giá thực tế user trả (để làm báo cáo doanh thu)
    activated_at DATETIME NOT NULL,             -- Thời điểm gói bắt đầu kích hoạt
    expired_at DATETIME NOT NULL,               -- Thời điểm gói hết hạn
    payment_status VARCHAR(50) DEFAULT 'completed', -- Trạng thái: 'pending', 'completed', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Khai báo khóa ngoại (Foreign Key) để ràng buộc dữ liệu
    FOREIGN KEY (package_id) REFERENCES membership_packages(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =============================================
-- 10. COURSE REGISTRATIONS TABLE
-- =============================================
CREATE TABLE course_registrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT NOT NULL,
    course_id INT NOT NULL,
    registration_date DATE DEFAULT (CURRENT_DATE),
    end_date DATE,
    completed_sessions INT DEFAULT 0,
    status ENUM('active', 'completed', 'cancelled', 'paused') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_registrations_member ON course_registrations(member_id);
CREATE INDEX idx_registrations_course ON course_registrations(course_id);
CREATE INDEX idx_registrations_status ON course_registrations(status);
CREATE INDEX idx_registrations_member_course ON course_registrations(member_id, course_id);

-- =============================================
-- 11. PAYMENTS TABLE
-- FIX: khớp lại với src/repositories/payment.repository.js + finance.controller.js
-- (đọc/ghi user_id, invoice_code, membership_id, type, note, created_by).
-- membership_id trỏ tới user_subscriptions vì đó là bảng thật đang được
-- src/repositories/package/package.repository.js dùng để lưu gói đã mua/gán
-- (member_memberships hiện không còn được luồng mua/gán gói nào ghi vào nữa).
-- =============================================
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_code VARCHAR(20) UNIQUE,
    user_id INT NOT NULL,
    membership_id INT,
    package_id INT,
    type VARCHAR(30) NOT NULL DEFAULT 'registration' COMMENT 'registration, pt, class, other',
    amount DECIMAL(12, 2) NOT NULL,
    payment_method ENUM('cash', 'card', 'transfer', 'momo', 'zalopay') DEFAULT 'cash',
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('paid', 'pending', 'refunded', 'cancelled') DEFAULT 'paid',
    note TEXT,
    created_by INT,
    -- Liên kết mềm tới class_enrollments(id) khi type='class' (vé lượt đặt lớp).
    -- Không đặt FOREIGN KEY vì class_enrollments được tạo sau payments trong file này.
    class_enrollment_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (membership_id) REFERENCES user_subscriptions(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (package_id) REFERENCES membership_packages(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX idx_payments_class_enrollment ON payments(class_enrollment_id);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);

-- =============================================
-- 12b.
-- =============================================
CREATE TABLE member_memberships (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    package_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('active', 'expired', 'cancelled') NOT NULL DEFAULT 'active',
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (package_id) REFERENCES membership_packages(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_member_memberships_user ON member_memberships(user_id);
CREATE INDEX idx_member_memberships_status ON member_memberships(status);
-- =============================================
-- 14. NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type ENUM('info', 'warning', 'success', 'error') DEFAULT 'info',
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- =============================================
-- 15. EMPLOYEE_SCHEDULE_ASSIGNMENTS TABLE
-- FIX: Đã thêm bảng này để lưu trữ lịch phân ca của nhân viên (sử dụng bởi employee.repository.js)
-- =============================================
CREATE TABLE employee_schedule_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    shift_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES staffs(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_employee_schedule_assignments_date ON employee_schedule_assignments(date);
CREATE INDEX idx_employee_schedule_assignments_employee ON employee_schedule_assignments(employee_id);

-- =============================================
-- EQUIPMENT TABLE
-- Dùng bởi src/repositories/equipment.repository.js (trang /equipment)
-- =============================================
CREATE TABLE equipment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    type ENUM('reformer', 'cadillac', 'chair', 'barrel', 'tower', 'other') NOT NULL DEFAULT 'reformer',
    serial_number VARCHAR(100),
    status ENUM('active', 'maintenance', 'retired') NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_equipment_status ON equipment(status);


-- NOTE:AI không sửa hàm này.Đây là bảng cố định chung
CREATE TABLE IF NOT EXISTS classes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    instructor VARCHAR(100) NOT NULL,
    day VARCHAR(50) NOT NULL,
    time VARCHAR(50) NOT NULL,
    level VARCHAR(50) NOT NULL,
    capacity INT DEFAULT 10,
    price DECIMAL(12, 0) NOT NULL DEFAULT 0 COMMENT 'Giá vé lượt (VNĐ) — thu khi hội viên chưa có gói VIP active'
);

-- NOTE:AI không sửa hàm này.Đây là bảng cố định chung
CREATE TABLE class_enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    user_id INT NOT NULL,
    
    status VARCHAR(50) DEFAULT 'pending', 
    
    -- booking_type: 1 (Có vé tháng - TH1), 0 (Mua lẻ/Không vé - TH2)
    booking_type TINYINT(1) NOT NULL DEFAULT 0,    
    payment_status VARCHAR(50) DEFAULT 'completed', 
    subscription_id INT DEFAULT NULL,     

    approved_by INT DEFAULT NULL,         
    approved_at DATETIME DEFAULT NULL,    
    admin_note TEXT,                      

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- ROLE_PERMISSIONS TABLE
-- Dùng bởi src/routes/permissions.routes.js (trang /permissions)
-- =============================================
CREATE TABLE role_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role VARCHAR(50) NOT NULL,
    permission VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_role_permission (role, permission)
);

-- =============================================
-- TRIGGERS
-- =============================================

DELIMITER $$

-- Auto generate member_code
CREATE TRIGGER trg_member_code BEFORE INSERT ON members
FOR EACH ROW
BEGIN
    DECLARE next_id INT;
    SELECT IFNULL(MAX(id), 0) + 1 INTO next_id FROM members;
    IF NEW.member_code IS NULL OR NEW.member_code = '' THEN
        SET NEW.member_code = CONCAT('MEM', LPAD(next_id, 5, '0'));
    END IF;
END;

-- Auto generate trainer_code
CREATE TRIGGER trg_trainer_code BEFORE INSERT ON trainers
FOR EACH ROW
BEGIN
    DECLARE next_id INT;
    SELECT IFNULL(MAX(id), 0) + 1 INTO next_id FROM trainers;
    IF NEW.trainer_code IS NULL OR NEW.trainer_code = '' THEN
        SET NEW.trainer_code = CONCAT('TRN', LPAD(next_id, 5, '0'));
    END IF;
END;

-- Auto generate staff_code
CREATE TRIGGER trg_staff_code BEFORE INSERT ON staffs
FOR EACH ROW
BEGIN
    DECLARE next_id INT;
    SELECT IFNULL(MAX(id), 0) + 1 INTO next_id FROM staffs;
    IF NEW.staff_code IS NULL OR NEW.staff_code = '' THEN
        SET NEW.staff_code = CONCAT('STF', LPAD(next_id, 5, '0'));
    END IF;
END;

-- Auto generate course_code
CREATE TRIGGER trg_course_code BEFORE INSERT ON courses
FOR EACH ROW
BEGIN
    DECLARE next_id INT;
    SELECT IFNULL(MAX(id), 0) + 1 INTO next_id FROM courses;
    IF NEW.course_code IS NULL OR NEW.course_code = '' THEN
        SET NEW.course_code = CONCAT('CRS', LPAD(next_id, 5, '0'));
    END IF;
END;

-- =============================================
-- STORED PROCEDURES
-- =============================================

-- FIX: Sửa lỗi BETWEEN với DATETIME — bản ghi cuối ngày (vd: 14:30) bị bỏ sót
CREATE PROCEDURE sp_revenue_report(IN p_start_date DATE, IN p_end_date DATE)
BEGIN
    SELECT
        DATE_FORMAT(payment_date, '%Y-%m') AS month,
        COUNT(*) AS total_transactions,
        SUM(amount) AS total_revenue,
        AVG(amount) AS avg_revenue
    FROM payments
    WHERE payment_date >= p_start_date
      AND payment_date < DATE_ADD(p_end_date, INTERVAL 1 DAY)
      AND status = 'paid'
    GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
    ORDER BY month;
END;

-- Monthly Member Statistics
CREATE PROCEDURE sp_member_stats()
BEGIN
    SELECT
        COUNT(*) AS total_members,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_members,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) AS inactive_members,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) AS expired_members,
        SUM(CASE WHEN MONTH(join_date) = MONTH(CURRENT_DATE) AND YEAR(join_date) = YEAR(CURRENT_DATE) THEN 1 ELSE 0 END) AS new_this_month
    FROM members;
END;

-- Top Selling Courses
CREATE PROCEDURE sp_top_courses(IN p_limit INT)
BEGIN
    SELECT
        c.id,
        c.course_code,
        c.name,
        c.price,
        COUNT(cr.id) AS total_registrations,
        SUM(CASE WHEN cr.status = 'active' THEN 1 ELSE 0 END) AS active_registrations
    FROM courses c
    LEFT JOIN course_registrations cr ON c.id = cr.course_id
    GROUP BY c.id
    ORDER BY total_registrations DESC
    LIMIT p_limit;
END;

-- Dashboard Summary
CREATE PROCEDURE sp_dashboard_summary()
BEGIN
    SELECT
        (SELECT COUNT(*) FROM members) AS total_members,
        (SELECT COUNT(*) FROM trainers WHERE status = 'active') AS total_trainers,
        (SELECT COUNT(*) FROM courses WHERE status = 'active') AS total_courses,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'paid') AS total_revenue,
        (SELECT COUNT(*) FROM members WHERE MONTH(join_date) = MONTH(CURRENT_DATE) AND YEAR(join_date) = YEAR(CURRENT_DATE)) AS new_members_this_month;
END;

-- Attendance Report
CREATE PROCEDURE sp_attendance_report(IN p_member_id INT)
BEGIN
    SELECT
        m.full_name,
        COUNT(a.id) AS total_sessions,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN a.status = 'absent'  THEN 1 ELSE 0 END) AS absent_count,
        SUM(CASE WHEN a.status = 'late'    THEN 1 ELSE 0 END) AS late_count,
        ROUND(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(a.id) * 100, 2) AS attendance_rate
    FROM members m
    LEFT JOIN attendances a ON m.id = a.member_id
    WHERE (p_member_id IS NULL OR m.id = p_member_id)
    GROUP BY m.id;
END;

DELIMITER ;

INSERT INTO equipment (name, type, serial_number, status, notes) VALUES
('Reformer #1',     'reformer', 'RF-001', 'active',      'Phòng Reformer, tầng 2'),
('Reformer #2',     'reformer', 'RF-002', 'active',      'Phòng Reformer, tầng 2'),
('Cadillac #1',     'cadillac', 'CD-001', 'active',      'Phòng VIP, tầng 3'),
('Wunda Chair #1',  'chair',    'CH-001', 'maintenance', 'Đang chờ thay lò xo'),
('Barrel #1',       'barrel',   'BR-001', 'active',      'Phòng Barre, tầng 1'),
('Tower #1',        'tower',    'TW-001', 'retired',     'Đã ngưng sử dụng, chờ thanh lý');


INSERT INTO role_permissions (role, permission) VALUES
('admin', 'member.view'), ('admin', 'member.add'), ('admin', 'member.edit'), ('admin', 'member.delete'),
('admin', 'staff.view'), ('admin', 'staff.manage'),
('admin', 'package.view'), ('admin', 'package.manage'),
('admin', 'class.view'), ('admin', 'class.manage'),
('admin', 'finance.view'), ('admin', 'finance.manage'), ('admin', 'finance.invoice'),
('admin', 'equipment.view'), ('admin', 'equipment.manage'), ('admin', 'report.view'),
('staff', 'member.view'), ('staff', 'member.add'), ('staff', 'member.edit'),
('staff', 'package.view'), ('staff', 'package.manage'),
('staff', 'class.view'), ('staff', 'class.manage'),
('staff', 'finance.view'), ('staff', 'finance.manage'), ('staff', 'finance.invoice'),
('staff', 'equipment.view'), ('staff', 'report.view'),
('trainer', 'member.view'), ('trainer', 'package.view'),
('trainer', 'class.view'), ('trainer', 'class.manage');
