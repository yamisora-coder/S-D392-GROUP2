import React, { useState } from 'react';
import { authService } from '../services/auth.js';

export default function LoginPage({ onNavigate, onLoginSuccess }) {
  // Tab phân hệ nhanh: 'all' (Tự động nhận diện) | 'student' (Thí sinh) | 'instructor' (Giảng viên)
  const [selectedRole, setSelectedRole] = useState('student');

  const [emailOrId, setEmailOrId] = useState('SE180123');
  const [password, setPassword] = useState('Password@123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [language, setLanguage] = useState('VN');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFocusedEmail, setIsFocusedEmail] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);

  // Switch role and prefill demo account
  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setErrorMessage('');
    if (role === 'student') {
      setEmailOrId('SE180123');
      setPassword('Password@123');
    } else if (role === 'instructor') {
      setEmailOrId('gv.nguyen@fpt.edu.vn');
      setPassword('Password@123');
    } else if (role === 'admin') {
      setEmailOrId('admin@aives.edu.vn');
      setPassword('Password@123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailOrId.trim() || !password.trim()) {
      setErrorMessage('Vui lòng nhập Email / Mã định danh và Mật khẩu!');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await authService.login({ emailOrId, password });
      if (res.success) {
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Đăng nhập không thành công!');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (id, pwd, role) => {
    setEmailOrId(id);
    setPassword(pwd);
    setSelectedRole(role);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-900/5">
      {/* Animated Ambient Glow Blobs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl pointer-events-none animate-blob"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none animate-blob [animation-delay:3s]"></div>
      <div className="absolute top-2/3 left-1/3 w-72 h-72 bg-cyan-400/15 rounded-full blur-3xl pointer-events-none animate-blob [animation-delay:5s]"></div>

      {/* Main Glassmorphism Card */}
      <div className="relative z-10 max-w-md w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-900/10 border border-white/80 p-8 sm:p-9 animate-fade-in-up transition-all duration-300 hover:shadow-blue-900/15">
        {/* Top Header Row with Language switcher */}
        <div className="flex items-center justify-end mb-6">
          <div className="flex items-center border border-slate-200/80 rounded-xl p-0.5 bg-slate-50 shadow-2xs">
            <button
              type="button"
              onClick={() => setLanguage('EN')}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
                language === 'EN'
                  ? 'text-blue-700 bg-white shadow-xs scale-100'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('VN')}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
                language === 'VN'
                  ? 'text-blue-700 bg-white shadow-xs scale-100'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              VN
            </button>
          </div>
        </div>

        {/* Brand Icon & Heading */}
        <div className="text-center mb-5">
          <div
            className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl text-white mb-3 shadow-lg animate-float transition-all duration-300 ${
              selectedRole === 'admin'
                ? 'bg-gradient-to-tr from-amber-500 to-orange-600 shadow-amber-500/25'
                : selectedRole === 'instructor'
                ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-indigo-500/25'
                : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 shadow-blue-500/25'
            }`}
          >
            <i
              className={`text-2xl fa-solid ${
                selectedRole === 'admin'
                  ? 'fa-shield-halved'
                  : selectedRole === 'instructor'
                  ? 'fa-chalkboard-user'
                  : 'fa-graduation-cap'
              }`}
            ></i>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            {selectedRole === 'admin'
              ? 'AIVES Admin Console'
              : selectedRole === 'instructor'
              ? 'AIVES Cổng Giảng viên'
              : 'AIVES Cổng Thí sinh'}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {selectedRole === 'admin'
              ? 'Quản trị Tài khoản, Cấu hình AI & Quản trị Hệ thống'
              : selectedRole === 'instructor'
              ? 'Quản lý Ngân hàng câu hỏi, Tạo kỳ thi & Chấm duyệt điểm'
              : 'Tham gia Vấn đáp AI, Xem lịch thi & Tra cứu điểm số'}
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/90 rounded-2xl mb-5 border border-slate-200/60 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleRoleChange('student')}
            className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
              selectedRole === 'student'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <i className="fa-solid fa-graduation-cap text-[11px]"></i>
            <span>Thí sinh</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('instructor')}
            className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
              selectedRole === 'instructor'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <i className="fa-solid fa-chalkboard-user text-[11px]"></i>
            <span>Giảng viên</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('admin')}
            className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              selectedRole === 'admin'
                ? 'bg-white text-amber-700 shadow-xs border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <i className="fa-solid fa-shield-halved text-[11px]"></i>
            <span>Admin</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50/90 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 animate-fade-in shadow-xs">
            <span className="material-symbols-outlined text-[18px] text-rose-600">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {selectedRole === 'admin'
                ? 'Email Quản trị viên / Mã định danh Admin'
                : selectedRole === 'instructor'
                ? 'Email Giảng viên / Mã cán bộ (GV)'
                : 'Email / Mã số sinh viên (MSSV)'}
            </label>
            <div
              className={`relative rounded-xl border transition-all duration-200 ${
                isFocusedEmail
                  ? selectedRole === 'admin'
                    ? 'border-amber-600 bg-white ring-4 ring-amber-600/10 shadow-xs'
                    : selectedRole === 'instructor'
                    ? 'border-indigo-600 bg-white ring-4 ring-indigo-600/10 shadow-xs'
                    : 'border-blue-600 bg-white ring-4 ring-blue-600/10 shadow-xs'
                  : 'border-slate-200/90 bg-slate-50/80 hover:bg-slate-50'
              }`}
            >
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <i
                  className={`fa-solid text-xs ${
                    selectedRole === 'admin'
                      ? 'fa-shield-halved text-amber-600'
                      : selectedRole === 'instructor'
                      ? 'fa-chalkboard-user text-indigo-600'
                      : 'fa-user text-blue-600'
                  }`}
                ></i>
              </span>
              <input
                type="text"
                value={emailOrId}
                onFocus={() => setIsFocusedEmail(true)}
                onBlur={() => setIsFocusedEmail(false)}
                onChange={(e) => setEmailOrId(e.target.value)}
                placeholder={
                  selectedRole === 'admin'
                    ? 'e.g. admin@aives.edu.vn hoặc ADMIN01'
                    : selectedRole === 'instructor'
                    ? 'e.g. gv.nguyen@fpt.edu.vn hoặc GV001'
                    : 'e.g. SE180123 hoặc phuctran5635@gmail.com'
                }
                className="w-full pl-10 pr-3.5 py-3 text-sm bg-transparent text-slate-900 placeholder-slate-400 font-medium focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Mật khẩu
              </label>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Mật khẩu mẫu mặc định cho tất cả tài khoản mock: Password@123');
                }}
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-semibold transition-colors"
              >
                Quên mật khẩu?
              </a>
            </div>
            <div
              className={`relative rounded-xl border transition-all duration-200 ${
                isFocusedPassword
                  ? selectedRole === 'admin'
                    ? 'border-amber-600 bg-white ring-4 ring-amber-600/10 shadow-xs'
                    : selectedRole === 'instructor'
                    ? 'border-indigo-600 bg-white ring-4 ring-indigo-600/10 shadow-xs'
                    : 'border-blue-600 bg-white ring-4 ring-blue-600/10 shadow-xs'
                  : 'border-slate-200/90 bg-slate-50/80 hover:bg-slate-50'
              }`}
            >
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <i className="fa-solid fa-lock text-xs"></i>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onFocus={() => setIsFocusedPassword(true)}
                onBlur={() => setIsFocusedPassword(false)}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-3 text-sm bg-transparent text-slate-900 placeholder-slate-400 font-medium focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
              >
                <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <label className="flex items-center text-slate-600 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mr-2.5 w-4 h-4 cursor-pointer transition-all"
              />
              <span className="group-hover:text-slate-900 transition-colors font-medium">Ghi nhớ đăng nhập</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 px-4 active:scale-[0.98] text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60 ${
              selectedRole === 'admin'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-amber-500/25'
                : selectedRole === 'instructor'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/25'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25'
            }`}
          >
            <span>
              {loading
                ? 'Đang xác thực thông tin...'
                : selectedRole === 'admin'
                ? 'Đăng nhập Quản trị viên (Admin)'
                : selectedRole === 'instructor'
                ? 'Đăng nhập Cổng Giảng viên'
                : 'Đăng nhập Cổng Thí sinh'}
            </span>
            <i className={`fa-solid ${loading ? 'fa-circle-notch fa-spin' : 'fa-arrow-right'} text-xs`}></i>
          </button>
        </form>

        {/* SSO Divider */}
        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-slate-200/80"></div>
          <span className="flex-shrink mx-4 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            Hoặc đăng nhập nhanh 1 chạm
          </span>
          <div className="flex-grow border-t border-slate-200/80"></div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            type="button"
            onClick={() =>
              onLoginSuccess({
                id: 'SE180123',
                fullName: 'Trần Hoàng Phúc',
                email: 'phuctran5635@gmail.com',
                role: 'STUDENT',
                department: 'Khoa Công nghệ Thông tin',
              })
            }
            className="py-2.5 px-2 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-blue-50/60 hover:border-blue-300 transition-all duration-200 flex items-center justify-center space-x-1 shadow-2xs hover:shadow-xs cursor-pointer active:scale-[0.99]"
          >
            <i className="fa-solid fa-graduation-cap text-blue-600 text-xs"></i>
            <span>Thí sinh</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onLoginSuccess({
                id: 'GV001',
                fullName: 'ThS. Nguyễn Văn Giảng',
                email: 'gv.nguyen@fpt.edu.vn',
                role: 'INSTRUCTOR',
                department: 'Bộ môn Kỹ thuật Phần mềm',
              })
            }
            className="py-2.5 px-2 border border-indigo-200/90 rounded-xl text-xs font-semibold text-indigo-800 bg-indigo-50/60 hover:bg-indigo-100/70 hover:border-indigo-300 transition-all duration-200 flex items-center justify-center space-x-1 shadow-2xs hover:shadow-xs cursor-pointer active:scale-[0.99]"
          >
            <i className="fa-solid fa-chalkboard-user text-indigo-600 text-xs"></i>
            <span>Giảng viên</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onLoginSuccess({
                id: 'ADMIN01',
                fullName: 'Quản trị viên Hệ thống',
                email: 'admin@aives.edu.vn',
                role: 'ADMIN',
                department: 'Phòng Khảo thí & Đảm bảo Chất lượng',
              })
            }
            className="py-2.5 px-2 border border-amber-200/90 rounded-xl text-xs font-semibold text-amber-800 bg-amber-50/60 hover:bg-amber-100/70 hover:border-amber-300 transition-all duration-200 flex items-center justify-center space-x-1 shadow-2xs hover:shadow-xs cursor-pointer active:scale-[0.99]"
          >
            <i className="fa-solid fa-shield-halved text-amber-600 text-xs"></i>
            <span>Admin</span>
          </button>
        </div>

        {/* Footer Navigation: Đổi thành 'Register' theo yêu cầu */}
        <div className="pt-4 border-t border-slate-100 text-center space-y-3">
          <p className="text-xs text-slate-600">
            Chưa có tài khoản?{' '}
            <button
              type="button"
              onClick={() => onNavigate('register')}
              className="text-blue-600 font-bold hover:text-blue-700 hover:underline cursor-pointer transition-colors"
            >
              Register
            </button>
          </p>

          <div className="text-xs text-slate-400 space-x-2 flex items-center justify-center font-medium">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert('Kiểm tra nhanh: Camera 1080p, Microphone và Ping mạng < 30ms đạt chuẩn AIVES!');
              }}
              className="hover:text-blue-600 transition-colors"
            >
              Kiểm tra thiết bị khách
            </a>
            <span>•</span>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert('Hotline trực ban Khảo thí 24/7: 1900 8888 (Máy lẻ 102)');
              }}
              className="hover:text-blue-600 transition-colors"
            >
              Hỗ trợ kỹ thuật
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
