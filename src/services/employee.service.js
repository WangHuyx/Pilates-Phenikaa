const EmployeeRepo = require('../repositories/employee.repository');

const POSITIONS = ['Lễ tân', 'Kế toán', 'Quản lý phòng tập', 'Nhân viên vệ sinh', 'Bảo vệ', 'Chăm sóc khách hàng', 'Marketing', 'IT'];
const DEPARTMENTS = ['Vận hành', 'Kinh doanh', 'Kế toán', 'Hành chính', 'Kỹ thuật'];

module.exports = {
  constants: { POSITIONS, DEPARTMENTS },
  getAll:    (status) => EmployeeRepo.findAll(status),
  getById:   (id)     => EmployeeRepo.findById(id),
  create:    (data)   => EmployeeRepo.create(data),
  update:    (id, data) => EmployeeRepo.update(id, data),
  remove:    (id)     => EmployeeRepo.remove(id),
};
