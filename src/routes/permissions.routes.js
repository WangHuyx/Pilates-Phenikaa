const express  = require('express');
const router   = express.Router();
const { requireAdmin } = require('../middleware/admin.middleware');
const pool     = require('../config/database');

const PERMISSION_GROUPS = [
  {
    label: 'HỘI VIÊN',
    items: [
      { key: 'member.view',   label: 'Xem danh sách hội viên' },
      { key: 'member.add',    label: 'Thêm hội viên' },
      { key: 'member.edit',   label: 'Chỉnh sửa hội viên' },
      { key: 'member.delete', label: 'Xóa hội viên' },
    ],
  },
  {
    label: 'NHÂN SỰ',
    items: [
      { key: 'staff.view',     label: 'Xem danh sách nhân sự' },
      { key: 'staff.manage',   label: 'Quản lý nhân sự' },
      { key: 'staff.salary',   label: 'Xem bảng lương' },
    ],
  },
  {
    label: 'GÓI TẬP & LỚP HỌC',
    items: [
      { key: 'package.view',   label: 'Xem gói tập' },
      { key: 'package.manage', label: 'Quản lý gói tập' },
      { key: 'class.view',     label: 'Xem lịch lớp học' },
      { key: 'class.manage',   label: 'Quản lý lớp học' },
    ],
  },
  {
    label: 'TÀI CHÍNH',
    items: [
      { key: 'finance.view',    label: 'Xem báo cáo tài chính' },
      { key: 'finance.manage',  label: 'Quản lý thanh toán' },
      { key: 'finance.invoice', label: 'Xuất hóa đơn' },
    ],
  },
  {
    label: 'THIẾT BỊ & BÁO CÁO',
    items: [
      { key: 'equipment.view',   label: 'Xem thiết bị' },
      { key: 'equipment.manage', label: 'Quản lý thiết bị' },
      { key: 'report.view',      label: 'Xem báo cáo thống kê' },
    ],
  },
];

const ROLES = [
  { key: 'admin',   label: 'Quản trị viên (Admin)' },
  { key: 'staff',   label: 'Lễ tân (Receptionist)' },
  { key: 'trainer', label: 'Huấn luyện viên (Trainer)' },
];

async function getRoleCounts() {
  const [rows] = await pool.query(
    'SELECT role, COUNT(*) AS cnt FROM role_permissions GROUP BY role'
  );
  const map = {};
  rows.forEach(r => { map[r.role] = Number(r.cnt); });
  return map;
}

async function getPermissionsForRole(role) {
  const [rows] = await pool.query(
    'SELECT permission FROM role_permissions WHERE role = ?', [role]
  );
  return new Set(rows.map(r => r.permission));
}

/* GET /permissions?role=staff */
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const selectedRole = ROLES.find(r => r.key === req.query.role) ? req.query.role : 'staff';
    const [counts, activePerms] = await Promise.all([
      getRoleCounts(),
      getPermissionsForRole(selectedRole),
    ]);
    const success = req.session.flash_success || null;
    const error   = req.session.flash_error   || null;
    delete req.session.flash_success;
    delete req.session.flash_error;
    res.render('permissions', {
      title: 'Phân quyền',
      user: req.session.user,
      roles: ROLES,
      selectedRole,
      groups: PERMISSION_GROUPS,
      activePerms,
      counts,
      success, error,
    });
  } catch (err) { next(err); }
});

/* POST /permissions/save */
router.post('/save', requireAdmin, async (req, res, next) => {
  try {
    const role = req.body.role;
    if (!ROLES.find(r => r.key === role)) {
      req.session.flash_error = 'Vai trò không hợp lệ.';
      return res.redirect('/permissions');
    }

    /* Collect all checked permission keys */
    const allKeys = PERMISSION_GROUPS.flatMap(g => g.items.map(i => i.key));
    const checked = allKeys.filter(k => req.body[k] === 'on');

    /* Admin always keeps all permissions */
    if (role === 'admin') {
      req.session.flash_error = 'Không thể thay đổi quyền Admin.';
      return res.redirect('/permissions?role=admin');
    }

    /* Replace permissions for this role */
    await pool.query('DELETE FROM role_permissions WHERE role = ?', [role]);
    if (checked.length) {
      const values = checked.map(p => [role, p]);
      await pool.query('INSERT INTO role_permissions (role, permission) VALUES ?', [values]);
    }

    req.session.flash_success = `Đã lưu ${checked.length} quyền cho vai trò "${ROLES.find(r=>r.key===role)?.label}".`;
    res.redirect('/permissions?role=' + role);
  } catch (err) { next(err); }
});

module.exports = router;
