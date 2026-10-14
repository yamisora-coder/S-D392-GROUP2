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
    // Giả lập độ trễ mạng nhẹ cho animation mượt mà
    await new Promise(resolve => setTimeout(resolve, 400));

    const users = getStoredUsers();
    const cleanKey = (emailOrId || '').trim().toLowerCase();
    const cleanPwd = (password || '').trim();

    const user = users.find(u => 
      (u.email?.toLowerCase() === cleanKey || u.id?.toLowerCase() === cleanKey)
    );

    if (!user) {
      throw new Error('Tài khoản (MSSV / Email) không tồn tại trên hệ thống!');
    }

    if (user.password && user.password !== cleanPwd) {
      throw new Error('Mật khẩu không chính xác! Vui lòng thử lại.');
    }

    // Lưu phiên đăng nhập
    localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
    return { success: true, user };
  },

  // Đăng ký tài khoản mới (Gọi trực tiếp Backend API lưu vào PostgreSQL, đồng thời đồng bộ LocalStorage)
  register: async (userData) => {
    const newUser = {
      ...userData,
      createdAt: new Date().toISOString()
    };

    // 1. Thử gọi trực tiếp API Backend Spring Boot để lưu vào PostgreSQL
    try {
      const response = await fetch('http://localhost:8080/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: userData.id,
          fullName: userData.fullName,
          email: userData.email,
          password: userData.password,
          role: userData.role || 'STUDENT'
        }),
      });

      if (response.ok) {
        const savedDbUser = await response.json();
        // Cập nhật ID từ DB nếu có
        newUser.dbId = savedDbUser.id;
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.message) {
          throw new Error(errorData.message);
        }
      }
    } catch (networkErr) {
      console.warn('Backend PostgreSQL chưa chạy hoặc không phản hồi, lưu vào bộ nhớ trình duyệt:', networkErr.message);
    }

    // 2. Lưu vào LocalStorage để người dùng đăng nhập và trải nghiệm ngay
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
      const response = await fetch(`http://localhost:8080/api/users/${encodeURIComponent(cleanId)}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
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
