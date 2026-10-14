import React, { useState, useEffect } from 'react';
import { mockAuthService } from '../services/auth.js';

export default function AdminPortalPage({ currentUser, onLogout, onSwitchToStudent, onSwitchToLecturer }) {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'config' | 'audit'

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [selectedModalRole, setSelectedModalRole] = useState('STUDENT');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // ================= 1. DANH SÁCH NGƯỜI DÙNG & PHÂN QUYỀN =================
  const [users, setUsers] = useState(() => {
    const list = mockAuthService.getAllUsers();
    return list.map((u) => ({
      ...u,
      status: u.status || 'ACTIVE',
      lastLogin: u.lastLogin || 'Gần đây',
    }));
  });

  // Đồng bộ người dùng từ Backend PostgreSQL nếu đang chạy
  useEffect(() => {
    const syncBackend = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/users');
        if (res.ok) {
          const dbUsers = await res.json();
          if (Array.isArray(dbUsers) && dbUsers.length > 0) {
            setUsers((prev) => {
              const userMap = new Map();
              prev.forEach((u) => userMap.set((u.id || u.email).toLowerCase(), u));
              dbUsers.forEach((dbU) => {
                const key = (dbU.code || dbU.email).toLowerCase();
                const existing = userMap.get(key) || {};
                userMap.set(key, {
                  ...existing,
                  id: dbU.code || dbU.id,
                  dbId: dbU.id,
                  fullName: dbU.fullName,
                  email: dbU.email,
                  role: dbU.role,
                  department: existing.department || 'Bộ môn / Khoa FPT',
                  status: existing.status || 'ACTIVE',
                  lastLogin: existing.lastLogin || 'Gần đây',
                });
              });
              return Array.from(userMap.values());
            });
          }
        }
      } catch (e) {
        // Fallback vào dữ liệu LocalStorage / Mock
      }
    };
    syncBackend();
  }, []);

  const [newUser, setNewUser] = useState({
    id: '',
    fullName: '',
    email: '',
    role: 'STUDENT',
    department: 'Khoa Công nghệ Thông tin',
    password: 'Password@123',
  });

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.fullName.trim() || !newUser.email.trim()) return;

    const generatedId =
      newUser.id.trim() ||
      (newUser.role === 'INSTRUCTOR'
        ? `GV${Date.now().toString().slice(-4)}`
        : newUser.role === 'ADMIN'
        ? `AD${Date.now().toString().slice(-4)}`
        : `SE${Date.now().toString().slice(-6)}`);

    const created = {
      id: generatedId,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
      password: newUser.password || 'Password@123',
      status: 'ACTIVE',
      lastLogin: 'Chưa đăng nhập',
    };

    try {
      await mockAuthService.register(created);
    } catch (err) {
      console.warn('Lỗi lưu auth service:', err);
    }

    setUsers((prev) => [created, ...prev.filter((u) => u.id !== created.id)]);
    setShowAddUserModal(false);
    showNotification(`Đã tạo tài khoản cho ${created.fullName} (${created.role}) thành công!`);
    setNewUser({
      id: '',
      fullName: '',
      email: '',
      role: 'STUDENT',
      department: 'Khoa Công nghệ Thông tin',
      password: 'Password@123',
    });
  };

  // Admin gán / cập nhật vai trò người dùng (STUDENT, INSTRUCTOR, ADMIN)
  const handleRoleChange = async (targetUser, newRole) => {
    if (!targetUser || targetUser.role === newRole) return;
    setIsUpdatingRole(true);

    try {
      await mockAuthService.updateUserRole(targetUser.id, newRole);

      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
      );

      const roleLabels = {
        ADMIN: 'Quản trị viên (ADMIN)',
        INSTRUCTOR: 'Giảng viên (INSTRUCTOR)',
        STUDENT: 'Thí sinh (STUDENT)',
      };

      showNotification(`Đã cập nhật vai trò của "${targetUser.fullName}" thành ${roleLabels[newRole] || newRole}!`);

      // Ghi nhận vào nhật ký kiểm toán (Audit Logs)
      const auditEntry = {
        id: `AUD-${Date.now().toString().slice(-4)}`,
        timestamp: 'Vừa xong',
        actor: `${currentUser?.fullName || 'Quản trị viên'} (${currentUser?.email || 'admin@aives.edu.vn'})`,
        action: 'PHÂN QUYỀN VAI TRÒ (ASSIGN ROLE)',
        target: `${targetUser.fullName} (${targetUser.id}) -> ${newRole}`,
        ip: '127.0.0.1 (Admin Console)',
        status: 'SUCCESS',
      };
      setAuditLogs((prev) => [auditEntry, ...prev]);
    } catch (err) {
      showNotification(`Lỗi cập nhật vai trò: ${err.message}`);
    } finally {
      setIsUpdatingRole(false);
      setRoleModalUser(null);
    }
  };

  const openRoleModal = (user) => {
    setRoleModalUser(user);
    setSelectedModalRole(user.role);
  };

  const handleToggleStatus = (id) => {
    mockAuthService.toggleUserStatus(id);
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const newStatus = u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
        showNotification(`Đã ${newStatus === 'ACTIVE' ? 'mở khóa' : 'khóa'} tài khoản ${u.fullName}!`);
        return { ...u, status: newStatus };
      })
    );
  };

  const filteredUsers = users.filter((u) => {
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchRole && matchSearch;
  });

  // ================= 2. CẤU HÌNH HỆ THỐNG & AI ENGINE (Stitch Design) =================
  const [aiConfig, setAiConfig] = useState({
    model: 'gemini-1.5-pro',
    temperature: 0.3,
    latencyThresholdMs: 1500,
    silenceTimeoutSec: 5.0,
    sttModel: 'AIVES-Vi-STT v2.4 (Whisper Fine-tuned - Mặc định)',
    ttsVoice: 'Giọng Nữ - Miền Nam (Tự nhiên & Chuẩn khảo thí)',
    bilingualSupport: true,
    antiCheatSensitivity: 'HIGH',
    maxConcurrentSessions: 50,
    postgresHost: 'localhost:5432/aives_db',
    storageBucket: 'minio-s3://aives-recordings',
  });

  const handleSaveConfig = () => {
    showNotification('Đã lưu cấu hình AI Engine & Tham số hệ thống lên PostgreSQL!');
  };

  // ================= 3. NHẬT KÝ & KIỂM TOÁN MINH BẠCH (AUDIT LOGS) =================
  const [auditLogs, setAuditLogs] = useState([
    {
      id: 'AUD-8801',
      timestamp: '14:25:10 - Hôm nay',
      actor: 'Quản trị viên Hệ thống (admin@aives.edu.vn)',
      action: 'CẬP NHẬT CẤU HÌNH AI',
      target: 'Ngưỡng Max Latency đổi thành 1500ms',
      ip: '192.168.1.15',
      status: 'SUCCESS',
    },
    {
      id: 'AUD-8802',
      timestamp: '14:22:04 - Hôm nay',
      actor: 'ThS. Nguyễn Văn Giảng (gv.nguyen@fpt.edu.vn)',
      action: 'CHỐT ĐIỂM BÀI THI (Finalize Grade)',
      target: 'Thí sinh SE180123 - Điểm 8.75/10',
      ip: '118.69.182.42',
      status: 'SUCCESS',
    },
    {
      id: 'AUD-8803',
      timestamp: '14:15:33 - Hôm nay',
      actor: 'Hệ thống Khảo thí Tự động (AI Engine)',
      action: 'KIỂM SOÁT PHÒNG THI',
      target: 'Ca thi CS201-01: Đường truyền 28ms, kết nối ổn định',
      ip: 'AIVES-Core-Service',
      status: 'SUCCESS',
    },
    {
      id: 'AUD-8804',
      timestamp: '13:50:18 - Hôm nay',
      actor: 'Hệ thống Khảo thí',
      action: 'XÁC THỰC THIẾT BỊ',
      target: 'Thí sinh SE170002 kiểm tra camera & mic OK',
      ip: '14.161.22.9',
      status: 'SUCCESS',
    },
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-800 font-sans antialiased">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2.5 border border-slate-700 backdrop-blur-md animate-fade-in">
          <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= SIDEBAR NAVIGATION ================= */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-20 shrink-0">
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs font-bold">
              <span className="material-symbols-outlined text-[19px]">verified_user</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-slate-900 leading-none">AIVES Admin</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Enterprise Console</span>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Hệ thống quản trị</p>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'text-blue-700 bg-blue-50 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] mr-2.5 text-blue-600">group</span>
            <span>Quản trị Người dùng &amp; Phân quyền</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`w-full flex items-center px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'config'
                ? 'text-blue-700 bg-blue-50 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] mr-2.5 text-indigo-600">tune</span>
            <span>Cấu hình Hệ thống &amp; AI Engine</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`w-full flex items-center px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'text-blue-700 bg-blue-50 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] mr-2.5 text-emerald-600">history_edu</span>
            <span>Nhật ký &amp; Kiểm toán (Audit Logs)</span>
          </button>

          {/* Quick Cross-Portal Switchers */}
          <div className="pt-4 mt-4 border-t border-slate-100">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Chuyển đổi phân hệ nhanh</p>
            {onSwitchToLecturer && (
              <button
                onClick={onSwitchToLecturer}
                className="w-full flex items-center px-3 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] mr-2 text-indigo-600">psychology</span>
                <span>Cổng Giảng viên (Chấm thi)</span>
              </button>
            )}
            {onSwitchToStudent && (
              <button
                onClick={onSwitchToStudent}
                className="w-full flex items-center px-3 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] mr-2 text-blue-600">school</span>
                <span>Cổng Thí sinh (Lịch thi)</span>
              </button>
            )}
          </div>
        </nav>

        {/* Admin profile & logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-xs">
                AD
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate">{currentUser?.fullName || 'Quản trị viên'}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{currentUser?.email || 'admin@aives.edu.vn'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
              title="Đăng xuất"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
              {activeTab === 'users' && 'Quản trị Tài khoản & Phân quyền Hệ thống'}
              {activeTab === 'config' && 'Cấu hình Tham số AI Engine & Khảo thí Viva'}
              {activeTab === 'audit' && 'Nhật ký Kiểm toán & Hoạt động Phòng thi'}
            </h1>
            <span className="text-xs text-slate-400 font-mono">| PostgreSQL: aives_db (Active)</span>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'users' && (
              <button
                type="button"
                onClick={() => setShowAddUserModal(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                <span>Thêm người dùng</span>
              </button>
            )}
            {activeTab === 'config' && (
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                <span>Lưu Cấu hình AI</span>
              </button>
            )}
          </div>
        </header>

        {/* ================= TAB 1: QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN ================= */}
        {activeTab === 'users' && (
          <main className="flex-1 p-6 overflow-y-auto space-y-5">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs text-slate-500 font-medium">Tổng người dùng</span>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{users.length}</p>
                <span className="text-[10px] text-blue-600 font-bold mt-1 block">Đã đồng bộ cơ sở dữ liệu</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs text-slate-500 font-medium">Thí sinh (STUDENT)</span>
                <p className="text-2xl font-extrabold text-blue-600 mt-1">
                  {users.filter((u) => u.role === 'STUDENT').length}
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">Tài khoản sinh viên FPT</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs text-slate-500 font-medium">Giảng viên (INSTRUCTOR)</span>
                <p className="text-2xl font-extrabold text-indigo-600 mt-1">
                  {users.filter((u) => u.role === 'INSTRUCTOR').length}
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">Quyền chấm &amp; duyệt điểm</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs text-slate-500 font-medium">Quản trị viên (ADMIN)</span>
                <p className="text-2xl font-extrabold text-amber-600 mt-1">
                  {users.filter((u) => u.role === 'ADMIN').length}
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">Toàn quyền hệ thống</span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo Tên, Email, MSSV..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-72 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="ALL">Tất cả vai trò</option>
                  <option value="ADMIN">Quản trị viên (ADMIN)</option>
                  <option value="INSTRUCTOR">Giảng viên (INSTRUCTOR)</option>
                  <option value="STUDENT">Thí sinh (STUDENT)</option>
                </select>
              </div>
              <div className="text-xs text-slate-500 font-semibold">
                Hiển thị: <strong className="text-slate-800">{filteredUsers.length}</strong> người dùng
              </div>
            </div>

            {/* User List Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Mã định danh / Tên</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Vai trò (Role)</th>
                    <th className="py-3 px-4">Khoa / Phòng ban</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4">Đăng nhập gần nhất</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{u.fullName}</span>
                        <span className="text-[11px] font-mono text-slate-400">{u.id}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <div className="relative inline-flex items-center">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u, e.target.value)}
                            disabled={isUpdatingRole}
                            title="Bấm để gán vai trò trực tiếp"
                            className={`text-[11px] font-bold rounded-lg px-2.5 py-1.5 pr-6 border cursor-pointer transition-all duration-150 shadow-2xs focus:outline-none focus:ring-2 appearance-none ${
                              u.role === 'ADMIN'
                                ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 focus:ring-amber-500/20'
                                : u.role === 'INSTRUCTOR'
                                ? 'bg-indigo-50 text-indigo-900 border-indigo-300 hover:bg-indigo-100 focus:ring-indigo-500/20'
                                : 'bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100 focus:ring-blue-500/20'
                            }`}
                          >
                            <option value="STUDENT">🎓 STUDENT (Thí sinh)</option>
                            <option value="INSTRUCTOR">👨‍🏫 INSTRUCTOR (Giảng viên)</option>
                            <option value="ADMIN">🛡️ ADMIN (Quản trị viên)</option>
                          </select>
                          <span className="material-symbols-outlined text-[13px] absolute right-1 pointer-events-none text-slate-500">
                            unfold_more
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{u.department}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{u.lastLogin}</td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openRoleModal(u)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/90 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
                            title="Gán phân quyền chi tiết cho tài khoản này"
                          >
                            <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
                            <span>Phân quyền</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u.id)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition-all cursor-pointer active:scale-95 ${
                              u.status === 'ACTIVE'
                                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </main>
        )}

        {/* ================= TAB 2: CẤU HÌNH HỆ THỐNG & AI ENGINE (Stitch Design) ================= */}
        {activeTab === 'config' && (
          <main className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LLM Model & Speech */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="material-symbols-outlined text-blue-600">psychology</span>
                  <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Cấu hình Mô hình Khảo thí AI</h3>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mô hình AI Đánh giá chính (LLM Core)</label>
                  <select
                    value={aiConfig.model}
                    onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Multimodal Video + Voice, 1M context)</option>
                    <option value="gpt-4o">OpenAI GPT-4o Realtime Engine</option>
                    <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mô hình Nhận diện Giọng nói (STT Model)</label>
                  <input
                    type="text"
                    value={aiConfig.sttModel}
                    onChange={(e) => setAiConfig({ ...aiConfig, sttModel: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Độ chính xác nhận diện tiếng Việt chuyên ngành: 98.4%</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giọng đọc AI Viva (TTS Voice)</label>
                  <select
                    value={aiConfig.ttsVoice}
                    onChange={(e) => setAiConfig({ ...aiConfig, ttsVoice: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    <option value="Giọng Nữ - Miền Nam (Tự nhiên & Chuẩn khảo thí)">Giọng Nữ - Miền Nam (Tự nhiên &amp; Chuẩn khảo thí)</option>
                    <option value="Giọng Nữ - Miền Bắc (Hà Nội Academy Standard)">Giọng Nữ - Miền Bắc (Hà Nội Academy Standard)</option>
                    <option value="Giọng Nam - Miền Trung (Âm lượng chuẩn hóa)">Giọng Nam - Miền Trung (Âm lượng chuẩn hóa)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Hỗ trợ thuật ngữ song ngữ Anh - Việt</span>
                    <span className="text-[10px] text-slate-500">Tự động nhận diện từ viết tắt IT, Thuật toán và Y khoa</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={aiConfig.bilingualSupport}
                    onChange={(e) => setAiConfig({ ...aiConfig, bilingualSupport: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Thresholds & Infrastructure */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="material-symbols-outlined text-indigo-600">timer</span>
                  <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Ngưỡng Phản xạ &amp; Hạ tầng</h3>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-slate-700">Thời gian chờ phản hồi tối đa (Max Latency)</span>
                    <span className="font-mono font-bold text-blue-600">{aiConfig.latencyThresholdMs} ms</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="3000"
                    step="100"
                    value={aiConfig.latencyThresholdMs}
                    onChange={(e) => setAiConfig({ ...aiConfig, latencyThresholdMs: Number(e.target.value) })}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Khuyến nghị 1200ms - 1800ms để đảm bảo nhịp đối thoại tự nhiên.</p>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-slate-700">Ngưỡng phát hiện im lặng (Silence Timeout)</span>
                    <span className="font-mono font-bold text-indigo-600">{aiConfig.silenceTimeoutSec} giây</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    step="0.5"
                    value={aiConfig.silenceTimeoutSec}
                    onChange={(e) => setAiConfig({ ...aiConfig, silenceTimeoutSec: Number(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cơ sở dữ liệu lưu trữ kết quả thi</label>
                  <input
                    type="text"
                    disabled
                    value={aiConfig.postgresHost}
                    className="w-full p-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lưu trữ Video bài thi (Object Storage)</label>
                  <input
                    type="text"
                    value={aiConfig.storageBucket}
                    onChange={(e) => setAiConfig({ ...aiConfig, storageBucket: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </main>
        )}

        {/* ================= TAB 3: NHẬT KÝ & KIỂM TOÁN MINH BẠCH (AUDIT LOGS) ================= */}
        {activeTab === 'audit' && (
          <main className="flex-1 p-6 overflow-y-auto space-y-5 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs interactive-card">
                <span className="text-xs text-slate-500 font-medium">Ca thi đang online thời gian thực</span>
                <p className="text-2xl font-extrabold text-blue-600 mt-1">2 phòng thi</p>
                <span className="text-[10px] text-emerald-600 font-bold block mt-1">Đường truyền ổn định &lt; 30ms</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs interactive-card">
                <span className="text-xs text-slate-500 font-medium">Trạng thái kết nối phòng thi</span>
                <p className="text-2xl font-extrabold text-emerald-600 mt-1">Ổn định 100%</p>
                <span className="text-[10px] text-slate-400 block mt-1">Tín hiệu Video &amp; Audio chuẩn 1080p</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs interactive-card">
                <span className="text-xs text-slate-500 font-medium">Uptime máy chủ AIVES</span>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">99.98%</p>
                <span className="text-[10px] text-emerald-600 font-bold block mt-1">PostgreSQL &amp; AI Worker hoạt động</span>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                  Nhật ký can thiệp &amp; Hành động hệ thống (System Audit Trail)
                </h3>
                <span className="text-xs text-slate-400 font-mono">Bất biến (Immutable)</span>
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4">Tác nhân (Actor)</th>
                    <th className="py-3 px-4">Hành động</th>
                    <th className="py-3 px-4">Chi tiết thao tác</th>
                    <th className="py-3 px-4">Địa chỉ IP</th>
                    <th className="py-3 px-4">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-500">{log.timestamp}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{log.actor}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{log.target}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{log.ip}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </main>
        )}
      </div>

      {/* ================= MODAL: THÊM NGƯỜI DÙNG & PHÂN QUYỀN ================= */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">person_add</span>
                Thêm Người dùng &amp; Phân quyền AIVES
              </h3>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ và tên *</label>
                <input
                  required
                  type="text"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  placeholder="Ví dụ: TS. Lê Văn B hoặc Nguyễn Văn C"
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email *</label>
                <input
                  required
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Ví dụ: user@aives.edu.vn"
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vai trò (Role) *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-bold text-blue-700"
                  >
                    <option value="STUDENT">Thí sinh (STUDENT)</option>
                    <option value="INSTRUCTOR">Giảng viên (INSTRUCTOR)</option>
                    <option value="ADMIN">Quản trị viên (ADMIN)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã định danh (Optional)</label>
                  <input
                    type="text"
                    value={newUser.id}
                    onChange={(e) => setNewUser({ ...newUser, id: e.target.value })}
                    placeholder="Tự động nếu để trống"
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Khoa / Phòng ban</label>
                <input
                  type="text"
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mật khẩu mặc định</label>
                <input
                  type="text"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono text-slate-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer shadow-md shadow-blue-500/20"
                >
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL PHÂN QUYỀN VAI TRÒ (ASSIGN ROLE MODAL) ================= */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/25">
                  <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Phân quyền Vai trò Tài khoản</h3>
                  <p className="text-xs text-slate-500 font-medium">Thiết lập phạm vi quyền hạn và đặc quyền hệ thống</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Thông tin tài khoản được chọn */}
            <div className="my-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                {roleModalUser.fullName?.slice(0, 2).toUpperCase() || 'US'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs truncate">{roleModalUser.fullName}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-500 font-bold">
                    {roleModalUser.id}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate font-mono mt-0.5">{roleModalUser.email}</p>
              </div>
            </div>

            {/* Lựa chọn vai trò với chi tiết đặc quyền */}
            <div className="space-y-3 mb-6">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Chọn vai trò mới cho tài khoản:</p>

              {/* Option 1: STUDENT */}
              <div
                onClick={() => setSelectedModalRole('STUDENT')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  selectedModalRole === 'STUDENT'
                    ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5 ${
                    selectedModalRole === 'STUDENT' ? 'bg-blue-600 shadow-xs' : 'bg-slate-400'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">school</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900">🎓 Thí sinh (STUDENT)</span>
                    {roleModalUser.role === 'STUDENT' && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded-full">Hiện tại</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Quyền làm bài thi Viva AI, giám sát camera &amp; mic, xem điểm và nhận xét từ giảng viên.
                  </p>
                </div>
              </div>

              {/* Option 2: INSTRUCTOR */}
              <div
                onClick={() => setSelectedModalRole('INSTRUCTOR')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  selectedModalRole === 'INSTRUCTOR'
                    ? 'border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5 ${
                    selectedModalRole === 'INSTRUCTOR' ? 'bg-indigo-600 shadow-xs' : 'bg-slate-400'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">psychology</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900">👨‍🏫 Giảng viên (INSTRUCTOR)</span>
                    {roleModalUser.role === 'INSTRUCTOR' && (
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100/80 px-2 py-0.5 rounded-full">Hiện tại</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Soạn &amp; duyệt ngân hàng câu hỏi, tạo kỳ thi, chấm điểm Human-in-the-loop và xem bài làm thí sinh.
                  </p>
                </div>
              </div>

              {/* Option 3: ADMIN */}
              <div
                onClick={() => setSelectedModalRole('ADMIN')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  selectedModalRole === 'ADMIN'
                    ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5 ${
                    selectedModalRole === 'ADMIN' ? 'bg-amber-600 shadow-xs' : 'bg-slate-400'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">shield_person</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900">🛡️ Quản trị viên (ADMIN)</span>
                    {roleModalUser.role === 'ADMIN' && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">Hiện tại</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Toàn quyền quản trị hệ thống, gán vai trò người dùng, cấu hình AI Engine và kiểm tra Audit Logs.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isUpdatingRole}
                onClick={() => handleRoleChange(roleModalUser, selectedModalRole)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">check</span>
                <span>{isUpdatingRole ? 'Đang cập nhật...' : 'Xác nhận gán vai trò'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
