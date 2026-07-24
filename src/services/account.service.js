const UserRepo = require('../repositories/user.repository');
const StaffRepo = require('../repositories/employee.repository');
const TrainerRepo = require('../repositories/trainer.repository');

const VALID_ROLES = ['admin', 'staff', 'trainer', 'member'];

/**
 * Khi 1 tài khoản được chuyển sang vai trò staff/trainer, tự tạo hồ sơ tương ứng
 * trong bảng staffs/trainers (nếu chưa có) để tài khoản đó hiện đúng ở "Danh sách
 * nhân sự" / "Huấn luyện viên" — theo đúng yêu cầu: đổi vai trò phải tự động hiện
 * ở cả danh sách tài khoản lẫn danh sách nhân sự, không cần tạo hồ sơ thủ công riêng.
 */
async function syncPersonnelRecord(user, role) {
  if (role === 'staff') {
    const existing = await StaffRepo.findByUserId(user.id);
    if (!existing) {
      await StaffRepo.create({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        position: 'Nhân viên',
        department: null,
        startDate: new Date().toISOString().slice(0, 10),
        userId: user.id,
      });
    }
  } else if (role === 'trainer') {
    const existing = await TrainerRepo.findByUserId(user.id);
    if (!existing) {
      const trainer_code = await TrainerRepo.generateCode();
      await TrainerRepo.create({
        trainer_code,
        full_name: user.fullName,
        specialization: null,
        phone: user.phone,
        email: user.email,
        hire_date: new Date().toISOString().slice(0, 10),
        user_id: user.id,
      });
    }
  }
}

const AccountService = {

  getAllUsers({ role } = {}) {
    return UserRepo.findAll({ role });
  },

  getUserById(id) {
    return UserRepo.findById(id);
  },

  async createUser({ username, fullName, email, password, role }) {
    if (!username || !fullName || !email || !password) {
      throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc.');
    }
    if (!VALID_ROLES.includes(role)) {
      throw new Error('Vai trò không hợp lệ.');
    }
    const existing = await UserRepo.findByUsername(username);
    if (existing) throw new Error(`Tên đăng nhập "${username}" đã tồn tại.`);
    return UserRepo.create({ username, fullName, email, password, role });
  },

  async updateUser(id, { fullName, email, role, password }) {
    const user = await UserRepo.findById(id);
    if (!user) throw new Error('Không tìm thấy tài khoản.');
    if (role && !VALID_ROLES.includes(role)) throw new Error('Vai trò không hợp lệ.');
    const fields = {};
    if (fullName) fields.fullName = fullName;
    if (email)    fields.email    = email;
    if (role)     fields.role     = role;
    if (password) fields.password = password;
    const updated = await UserRepo.update(id, fields);
    if (role && role !== user.role) {
      await syncPersonnelRecord(updated, role);
    }
    return updated;
  },

  async deleteUser(id, currentUserId) {
    if (Number(id) === Number(currentUserId)) {
      throw new Error('Không thể xóa tài khoản đang đăng nhập.');
    }
    const ok = await UserRepo.remove(id);
    if (!ok) throw new Error('Không tìm thấy tài khoản cần xóa.');
    return true;
  },

  async changeRole(id, role) {
    if (!VALID_ROLES.includes(role)) throw new Error('Vai trò không hợp lệ.');
    const user = await UserRepo.findById(id);
    if (!user) throw new Error('Không tìm thấy tài khoản.');
    const updated = await UserRepo.update(id, { role });
    if (role !== user.role) {
      await syncPersonnelRecord(updated, role);
    }
    return updated;
  },

  validRoles: VALID_ROLES,
};

module.exports = AccountService;
