// Dịch vụ xác thực & quản lý người dùng — gọi Backend Spring Boot (PostgreSQL)
import { api } from './api.js';

const STORAGE_CURRENT_USER_KEY = 'aives_current_user';

const DEPARTMENT_BY_ROLE = {
  ADMIN: 'Phòng Khảo thí & Đảm bảo Chất lượng',
  INSTRUCTOR: 'Bộ môn Kỹ thuật Phần mềm',
  STUDENT: 'Khoa Công nghệ Thông tin',
};

// Chuyển UserResponse của backend sang dạng FE đang dùng
// FE dùng `id` = mã định danh (MSSV / Mã GV), `dbId` = UUID trong PostgreSQL
export function toClientUser(dbUser) {
  if (!dbUser) return null;
  return {
    id: dbUser.code,
    dbId: dbUser.id,
    fullName: dbUser.fullName,
    email: dbUser.email,
    role: dbUser.role,
    status: dbUser.status || 'ACTIVE',
    department: DEPARTMENT_BY_ROLE[dbUser.role] || 'Khoa / Bộ môn',
    createdAt: dbUser.createdAt,
    lastLogin: '—',
  };
}

function saveSession(user) {
  localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
}

export const authService = {
  // Danh sách người dùng từ PostgreSQL
  getAllUsers: async () => {
    const list = await api.getUsers();
    return (list || []).map(toClientUser);
  },

  // Đăng nhập bằng MSSV / Mã GV / Email
  login: async ({ emailOrId, password }) => {
    const dbUser = await api.login((emailOrId || '').trim(), (password || '').trim());
    const user = { ...toClientUser(dbUser), lastLogin: 'Vừa xong' };
    saveSession(user);
    return { success: true, user };
  },

  // Đăng ký tài khoản (lưu vào PostgreSQL). `autoLogin=false` khi Admin tạo hộ.
  register: async (userData, { autoLogin = true } = {}) => {
    const dbUser = await api.register({
      code: userData.id,
      fullName: userData.fullName,
      email: userData.email,
      password: userData.password,
      role: userData.role || 'STUDENT',
    });
    const user = toClientUser(dbUser);
    if (autoLogin) saveSession(user);
    return { success: true, user };
  },

  getCurrentUser: () => {
    try {
      const data = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
  },

  // Admin gán vai trò
  updateUserRole: async (userIdOrCode, newRole) => {
    const cleanId = (userIdOrCode || '').trim();
    if (!cleanId) throw new Error('Mã tài khoản không hợp lệ!');
    const updated = toClientUser(await api.updateUserRole(cleanId, newRole));

    const current = authService.getCurrentUser();
    if (current && current.dbId === updated.dbId) {
      saveSession({ ...current, role: updated.role });
    }
    return { success: true, user: updated };
  },

  // Khóa / Mở khóa tài khoản
  toggleUserStatus: async (userIdOrCode) => {
    return toClientUser(await api.toggleUserStatus(userIdOrCode));
  },
};
