/**
 * auth.service.js
 * ------------------------------------------------------------------
 * TẦNG DỊCH VỤ (SERVICE LAYER) — chứa logic nghiệp vụ cho xác thực người dùng.
 *
 * Các controller gọi đến thành phần này, và nó lại gọi đến repository. Lớp service
 * là nơi chứa các quy tắc nghiệp vụ (ví dụ: "mật khẩu phải khớp với mã hash",
 * "không bao giờ để lộ mã hash mật khẩu ra bên ngoài"). Nó hoàn toàn không cần biết hay quan tâm
 * liệu dữ liệu bên dưới là một mảng trong bộ nhớ (in-memory array) hay là cơ sở dữ liệu thực —
 * đó là nhiệm vụ của repository.
 * ------------------------------------------------------------------
 */

const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');

/**
 * Attempt to log a user in.
 * @param {string} username
 * @param {string} plainPassword
 * @returns {Promise<{success: boolean, user?: object, message?: string}>}
 */
async function login(username, plainPassword) {
  if (!username || !plainPassword) {
    return { success: false, message: 'Please enter both username and password.' };
  }

  const user = await userRepository.findByUsername(username);
  if (!user) {
    return { success: false, message: 'Invalid username or password.' };
  }

  const passwordMatches = bcrypt.compareSync(plainPassword, user.passwordHash);
  if (!passwordMatches) {
    return { success: false, message: 'Invalid username or password.' };
  }


  // Loại bỏ mã băm mật khẩu trước khi đối tượng người dùng này được chuyển đi xa hơn
  // (vào session, vào view, v.v.).
  const { passwordHash, ...safeUser } = user;
  return { success: true, user: safeUser };
}

module.exports = { login };
