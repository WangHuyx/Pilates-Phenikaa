const UserRepo = require('../repositories/user.repository');

const VALID_ROLES = ['admin', 'staff', 'trainer', 'member'];

const AccountService = {

  getAllUsers() {
    return UserRepo.findAll();
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
    return UserRepo.update(id, fields);
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
    return UserRepo.update(id, { role });
  },

  validRoles: VALID_ROLES,
};

module.exports = AccountService;
