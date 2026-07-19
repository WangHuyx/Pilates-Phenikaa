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
        (SELECT COUNT(user_id) FROM class_enrollments) AS total_enrollments
      FROM classes
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
      FROM classes c
      LEFT JOIN class_enrollments e ON c.id = e.class_id
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

module.exports = { index, exportFinanceExcel };
