// Mock Data & LocalStorage Management for AIVES Frontend

const INITIAL_MOCK_USERS = [
  {
    id: 'ADMIN01',
    fullName: 'Quản trị viên Hệ thống',
    email: 'admin@aives.edu.vn',
    password: 'Password@123',
    role: 'ADMIN',
    department: 'Phòng Khảo thí & Đảm bảo Chất lượng',
    phone: '0909999999',
    status: 'ACTIVE',
    lastLogin: 'Vừa xong',
    createdAt: new Date().toISOString()
  },
  {
    id: 'GV001',
    fullName: 'ThS. Nguyễn Văn Giảng',
    email: 'gv.nguyen@fpt.edu.vn',
    password: 'Password@123',
    role: 'INSTRUCTOR',
    department: 'Bộ môn Kỹ thuật Phần mềm',
    phone: '0903123456',
    status: 'ACTIVE',
    lastLogin: '10 phút trước',
    createdAt: new Date().toISOString()
  },
  {
    id: 'SE180123',
    fullName: 'Trần Hoàng Phúc',
    email: 'phuctran5635@gmail.com',
    password: 'Password@123',
    role: 'STUDENT',
    department: 'Khoa Công nghệ Thông tin',
    phone: '0912345678',
    status: 'ACTIVE',
    lastLogin: '5 phút trước',
    createdAt: new Date().toISOString()
  },
  {
    id: 'SE170002',
    fullName: 'Lê Thị Bình',
    email: 'binh.lt.se170002@fpt.edu.vn',
    password: 'Password@123',
    role: 'STUDENT',
    department: 'Khoa Kỹ thuật Phần mềm',
    phone: '0987654321',
    status: 'ACTIVE',
    lastLogin: 'Hôm qua',
    createdAt: new Date().toISOString()
  },
  {
    id: 'SE170003',
    fullName: 'Phạm Minh Cường',
    email: 'cuong.pm.se170003@fpt.edu.vn',
    password: 'Password@123',
    role: 'STUDENT',
    department: 'Khoa An toàn Thông tin',
    phone: '0911223344',
    status: 'ACTIVE',
    lastLogin: '2 ngày trước',
    createdAt: new Date().toISOString()
  }
];

const STORAGE_USERS_KEY = 'aives_mock_users';
const STORAGE_CURRENT_USER_KEY = 'aives_current_user';

function getStoredUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(INITIAL_MOCK_USERS));
      return INITIAL_MOCK_USERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_MOCK_USERS;
  }
}

function saveStoredUsers(users) {
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

export const mockAuthService = {
  // Lấy danh sách tất cả người dùng mock
  getAllUsers: () => {
    return getStoredUsers();
  },

  // Đăng nhập
  login: async ({ emailOrId, password }) => {
    const cleanKey = (emailOrId || '').trim();
    const cleanPwd = (password || '').trim();

    // 1. Thử gọi API Backend Spring Boot /api/auth/login để xác thực thật và nhận JWT
    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanKey,
          password: cleanPwd,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok && result.data?.token) {
        const authData = result.data;
        const primaryRole = (authData.roles && authData.roles.length > 0)
          ? authData.roles[0]
          : 'STUDENT';
        const role = primaryRole === 'LECTURER' ? 'INSTRUCTOR' : primaryRole;

        const loggedInUser = {
          id: authData.email.split('@')[0],
          dbId: authData.userId,
          fullName: authData.fullName,
          email: authData.email,
          role: role,
          roles: authData.roles,
          token: authData.token,
        };

        localStorage.setItem('aives-token', authData.token);
        localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(loggedInUser));
        return { success: true, user: loggedInUser };
      } else if (!response.ok && result.message) {
        // Backend có phản hồi nhưng báo sai mật khẩu / tài khoản
        console.warn('Backend trả về thông báo:', result.message);
      }
    } catch (networkErr) {
      console.warn('Backend chưa phản hồi hoặc chưa chạy, chuyển sang kiểm tra LocalStorage mock:', networkErr.message);
    }

    // 2. Fallback sang LocalStorage nếu Backend offline
    const users = getStoredUsers();
    const cleanKeyLower = cleanKey.toLowerCase();
    const user = users.find(u => 
      (u.email?.toLowerCase() === cleanKeyLower || u.id?.toLowerCase() === cleanKeyLower)
    );

    if (!user) {
      throw new Error('Tài khoản (MSSV / Email) không tồn tại trên hệ thống!');
    }

    if (user.password && user.password !== cleanPwd) {
      throw new Error('Mật khẩu không chính xác! Vui lòng thử lại.');
    }

    localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
    return { success: true, user };
  },

  // Đăng ký tài khoản mới (Gọi trực tiếp Backend API lưu vào PostgreSQL, đồng thời đồng bộ LocalStorage)
  register: async (userData) => {
    const cleanRole = userData.role || 'STUDENT';
    const targetRole = cleanRole === 'INSTRUCTOR' ? 'LECTURER' : cleanRole;
    const reqBody = {
      fullName: userData.fullName,
      email: userData.email,
      password: userData.password,
      confirmPassword: userData.confirmPassword || userData.password,
      code: userData.id || userData.code,
      studentCode: userData.id || userData.code,
      role: targetRole,
    };

    let savedDbUser = null;
    // 1. Thử gọi trực tiếp API Backend Spring Boot để lưu vào PostgreSQL
    try {
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reqBody),
      });

      const resData = await response.json().catch(() => ({}));
      if (response.ok && resData.data) {
        savedDbUser = resData.data;
        if (savedDbUser.token) {
          localStorage.setItem('aives-token', savedDbUser.token);
        }
      } else if (!response.ok && resData.message) {
        throw new Error(resData.message);
      }
    } catch (networkErr) {
      if (networkErr.message && !networkErr.message.includes('Failed to fetch')) {
        throw networkErr;
      }
      console.warn('Backend PostgreSQL chưa chạy, lưu tạm vào bộ nhớ trình duyệt:', networkErr.message);
    }

    // 2. Lưu vào LocalStorage để người dùng đăng nhập và trải nghiệm ngay
    const newUser = {
      ...userData,
      dbId: savedDbUser?.userId || savedDbUser?.id,
      createdAt: new Date().toISOString(),
    };

    const users = getStoredUsers();
    const updatedUsers = [newUser, ...users.filter(u => u.id !== newUser.id && u.email !== newUser.email)];
    saveStoredUsers(updatedUsers);
    localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(newUser));

    return { success: true, user: newUser };
  },

  // Lấy user hiện tại đang đăng nhập
  getCurrentUser: () => {
    try {
      const data = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  // Đăng xuất
  logout: () => {
    const token = localStorage.getItem('aives-token');
    if (token) {
      fetch('http://localhost:8080/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }).catch(() => {});
    }
    localStorage.removeItem('aives-token');
    localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
  },

  // Admin cập nhật / gán vai trò (Role: ADMIN, INSTRUCTOR, STUDENT) của từng tài khoản
  updateUserRole: async (userIdOrCode, newRole) => {
    const cleanId = (userIdOrCode || '').trim();
    if (!cleanId) throw new Error('Mã tài khoản không hợp lệ!');

    const users = getStoredUsers();
    let updatedUser = null;
    const updatedList = users.map((u) => {
      if (
        u.id?.toLowerCase() === cleanId.toLowerCase() ||
        u.email?.toLowerCase() === cleanId.toLowerCase() ||
        (u.dbId && String(u.dbId) === cleanId)
      ) {
        updatedUser = { ...u, role: newRole };
        return updatedUser;
      }
      return u;
    });

    if (!updatedUser) {
      throw new Error(`Không tìm thấy người dùng ${cleanId} trong hệ thống!`);
    }

    saveStoredUsers(updatedList);

    // Cập nhật session hiện tại nếu tài khoản này đang đăng nhập
    const current = mockAuthService.getCurrentUser();
    if (
      current &&
      (current.id?.toLowerCase() === cleanId.toLowerCase() ||
        current.email?.toLowerCase() === cleanId.toLowerCase() ||
        (current.dbId && String(current.dbId) === cleanId))
    ) {
      localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify({ ...current, role: newRole }));
    }

    // Đồng bộ với Backend Spring Boot API (PostgreSQL) nếu đang chạy
    try {
      const token = localStorage.getItem('aives-token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`http://localhost:8080/api/users/${encodeURIComponent(cleanId)}/role`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ role: newRole }),
      });
      if (response.ok) {
        const backendUser = await response.json();
        console.log('Đã cập nhật role trên PostgreSQL backend:', backendUser);
      }
    } catch (networkErr) {
      console.warn('Backend chưa khả dụng, đã cập nhật vai trò trong LocalStorage:', networkErr.message);
    }

    return { success: true, user: updatedUser };
  },

  // Khóa / Mở khóa tài khoản
  toggleUserStatus: (userIdOrCode) => {
    const cleanId = (userIdOrCode || '').trim().toLowerCase();
    const users = getStoredUsers();
    let updatedUser = null;
    const updatedList = users.map((u) => {
      if (u.id?.toLowerCase() === cleanId || u.email?.toLowerCase() === cleanId) {
        const newStatus = u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
        updatedUser = { ...u, status: newStatus };
        return updatedUser;
      }
      return u;
    });
    if (updatedUser) {
      saveStoredUsers(updatedList);
    }
    return updatedUser;
  },

  // Khôi phục danh sách user mẫu
  resetMockData: () => {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(INITIAL_MOCK_USERS));
    return INITIAL_MOCK_USERS;
  }
};
