const pool = require('../config/database');
const ExcelJS = require('exceljs');

async function index(req, res, next) {
  try {
    const [[memberStats]] = await pool.query(`
      SELECT COUNT(*) AS total,
        SUM(CASE WHEN r.name='member'  THEN 1 ELSE 0 END) AS members,
        SUM(CASE WHEN r.name='trainer' THEN 1 ELSE 0 END) AS trainers,
        SUM(CASE WHEN r.name='staff'   THEN 1 ELSE 0 END) AS staff,
        SUM(CASE WHEN r.name='admin'   THEN 1 ELSE 0 END) AS admins
      FROM users u JOIN roles r ON u.role_id = r.id
    `);

    const [[classStats]] = await pool.query(`
      SELECT COUNT(*) AS total,
        COALESCE(SUM(capacity),0) AS total_capacity,
        (SELECT COUNT(user_id) FROM simple_class_enrollments) AS total_enrollments
      FROM simple_classes
    `);

    const [[staffStats]] = await pool.query(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active FROM staffs`
    ).catch(() => [[{ total: 0, active: 0 }]]);

    const [[activePackages]] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM member_memberships WHERE status='active' AND end_date >= CURDATE()`
    ).catch(() => [[{ cnt: 0 }]]);

    const [[revenueAll]] = await pool.query(
      `SELECT COALESCE(SUM(CASE WHEN status='paid' THEN amount ELSE 0 END),0) AS total FROM payments`
    ).catch(() => [[{ total: 0 }]]);

    const [revenueByMonth] = await pool.query(`
      SELECT DATE_FORMAT(payment_date,'%Y-%m') AS month,
             SUM(CASE WHEN status='paid' THEN amount ELSE 0 END) AS revenue,
             COUNT(*) AS count
      FROM payments GROUP BY month ORDER BY month DESC LIMIT 6
    `).catch(() => [[]]);

    const [popularClasses] = await pool.query(`
      SELECT c.name, c.instructor, c.capacity,
             COUNT(e.user_id) AS enrollments,
             ROUND(COUNT(e.user_id)/c.capacity*100) AS fill_pct
      FROM simple_classes c
      LEFT JOIN simple_class_enrollments e ON c.id = e.class_id
      GROUP BY c.id ORDER BY enrollments DESC
    `);

    res.render('reports', {
      title: 'Báo cáo', user: req.session.user,
      memberStats, classStats, staffStats,
      activePackages: activePackages.cnt,
      revenueAll: revenueAll.total,
      revenueByMonth, popularClasses,
    });
  } catch (err) { next(err); }
}

async function exportExcel(req, res, next) {
  try {
    const [members] = await pool.query(`
      SELECT u.username, u.full_name, u.email, r.name AS role,
        (SELECT COUNT(*) FROM simple_class_enrollments WHERE user_id=u.id) AS class_count
      FROM users u JOIN roles r ON u.role_id=r.id ORDER BY u.id
    `);
    const [revenue] = await pool.query(`
      SELECT DATE_FORMAT(payment_date,'%Y-%m') AS month,
        SUM(CASE WHEN status='paid' THEN amount ELSE 0 END) AS revenue,
        COUNT(*) AS count
      FROM payments GROUP BY month ORDER BY month
    `).catch(() => [[]]);
    const [classData] = await pool.query(`
      SELECT c.name, c.instructor, c.day, c.time, c.level, c.capacity,
        COUNT(e.user_id) AS enrollments
      FROM simple_classes c LEFT JOIN simple_class_enrollments e ON c.id=e.class_id
      GROUP BY c.id ORDER BY c.day, c.time
    `);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Pilates Phenikaa';
    wb.created = new Date();

    const hStyle = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B4332' } }, alignment: { horizontal: 'center' } };

    // Sheet 1: Hội viên
    const ws1 = wb.addWorksheet('Hội viên');
    ws1.columns = [
      { header: 'Username', key: 'username', width: 16 },
      { header: 'Họ tên', key: 'full_name', width: 22 },
      { header: 'Email', key: 'email', width: 26 },
      { header: 'Vai trò', key: 'role', width: 14 },
      { header: 'Lớp đăng ký', key: 'class_count', width: 14 },
    ];
    ws1.getRow(1).eachCell(c => { Object.assign(c, hStyle); });
    members.forEach(r => ws1.addRow(r));
    ws1.getColumn('class_count').numFmt = '0';

    // Sheet 2: Doanh thu
    const ws2 = wb.addWorksheet('Doanh thu theo tháng');
    ws2.columns = [
      { header: 'Tháng', key: 'month', width: 12 },
      { header: 'Doanh thu (VNĐ)', key: 'revenue', width: 20 },
      { header: 'Số giao dịch', key: 'count', width: 14 },
    ];
    ws2.getRow(1).eachCell(c => { Object.assign(c, hStyle); });
    revenue.forEach(r => ws2.addRow(r));
    ws2.getColumn('revenue').numFmt = '#,##0';

    // Sheet 3: Lớp học
    const ws3 = wb.addWorksheet('Lớp học');
    ws3.columns = [
      { header: 'Tên lớp', key: 'name', width: 24 },
      { header: 'HLV', key: 'instructor', width: 20 },
      { header: 'Thứ', key: 'day', width: 10 },
      { header: 'Giờ', key: 'time', width: 16 },
      { header: 'Cấp độ', key: 'level', width: 14 },
      { header: 'Sĩ số', key: 'capacity', width: 10 },
      { header: 'Đã đăng ký', key: 'enrollments', width: 12 },
    ];
    ws3.getRow(1).eachCell(c => { Object.assign(c, hStyle); });
    classData.forEach(r => ws3.addRow(r));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="baocao-pilates-${new Date().toISOString().split('T')[0]}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
}

async function exportFinanceExcel(req, res, next) {
  try {
    const [payments] = await pool.query(`
      SELECT p.payment_date, u.full_name, p.amount, p.payment_method, p.status, p.note
      FROM payments p JOIN users u ON p.user_id=u.id
      ORDER BY p.payment_date DESC
    `);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Pilates Phenikaa';
    const ws = wb.addWorksheet('Giao dịch');
    ws.columns = [
      { header: 'Ngày', key: 'payment_date', width: 14 },
      { header: 'Hội viên', key: 'full_name', width: 22 },
      { header: 'Số tiền (VNĐ)', key: 'amount', width: 18 },
      { header: 'Phương thức', key: 'payment_method', width: 14 },
      { header: 'Trạng thái', key: 'status', width: 14 },
      { header: 'Ghi chú', key: 'note', width: 24 },
    ];
    const hStyle = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B4332' } } };
    ws.getRow(1).eachCell(c => { Object.assign(c, hStyle); });
    payments.forEach(r => ws.addRow({ ...r, payment_date: r.payment_date ? new Date(r.payment_date).toLocaleDateString('vi-VN') : '' }));
    ws.getColumn('amount').numFmt = '#,##0';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="taichinh-pilates-${new Date().toISOString().split('T')[0]}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
}

module.exports = { index, exportExcel, exportFinanceExcel };
