const EmployeeRepo = require('../repositories/employee.repository');

const POSITIONS = ['Lễ tân', 'Kế toán', 'Quản lý phòng tập', 'Nhân viên vệ sinh', 'Bảo vệ', 'Chăm sóc khách hàng', 'Marketing', 'IT'];
const DEPARTMENTS = ['Vận hành', 'Kinh doanh', 'Kế toán', 'Hành chính', 'Kỹ thuật'];
const SHIFTS = [
  { id: 'morning',   name: 'Ca sáng',  startTime: '07:00', endTime: '13:00', color: 'blue'   },
  { id: 'afternoon', name: 'Ca chiều', startTime: '13:00', endTime: '19:00', color: 'amber'  },
  { id: 'evening',   name: 'Ca tối',   startTime: '19:00', endTime: '22:00', color: 'purple' },
  { id: 'fullday',   name: 'Ca ngày',  startTime: '07:00', endTime: '19:00', color: 'forest' },
];
const SHIFT_MAP = Object.fromEntries(SHIFTS.map(s => [s.id, s]));

function getMondayOf(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function buildDateLabels(weekStart) {
  const today = new Date().toISOString().slice(0, 10);
  const NAMES = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
  return NAMES.map((name, i) => {
    const date = addDays(weekStart, i);
    return { label: `${name} ${date.slice(5).replace('-', '/')}`, date, isToday: date === today };
  });
}

async function getSchedulePage(weekParam) {
  const weekStart  = getMondayOf(weekParam);
  const weekEnd    = addDays(weekStart, 6);
  const prevWeek   = addDays(weekStart, -7);
  const nextWeek   = addDays(weekStart, 7);
  const dateLabels = buildDateLabels(weekStart);

  const [employees, assignments] = await Promise.all([
    EmployeeRepo.findAll(),
    EmployeeRepo.findScheduleAssignments(weekStart, weekEnd),
  ]);

  const grid = {};
  for (const a of assignments) {
    const dateStr = a.date instanceof Date ? a.date.toISOString().slice(0, 10) : String(a.date).slice(0, 10);
    if (!grid[a.employee_id]) grid[a.employee_id] = {};
    if (!grid[a.employee_id][dateStr]) grid[a.employee_id][dateStr] = [];
    grid[a.employee_id][dateStr].push({ id: a.id, shiftId: a.shift_id, shift: SHIFT_MAP[a.shift_id] || null });
  }

  return { employees, shifts: SHIFTS, grid, dateLabels, weekStart, weekEnd, prevWeek, nextWeek };
}

module.exports = {
  constants: { POSITIONS, DEPARTMENTS },
  getAll:    (status) => EmployeeRepo.findAll(status),
  getById:   (id)     => EmployeeRepo.findById(id),
  create:    (data)   => EmployeeRepo.create(data),
  update:    (id, data) => EmployeeRepo.update(id, data),
  remove:    (id)     => EmployeeRepo.remove(id),
  getSchedulePage,
  addShift:    (data) => EmployeeRepo.addAssignment(data),
  deleteShift: (id)   => EmployeeRepo.deleteAssignment(id),
};
