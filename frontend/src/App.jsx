import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import StudentPortalPage from './pages/StudentPortalPage.jsx';
import AdminPortalPage from './pages/AdminPortalPage.jsx';
import LecturerPortalPage from './pages/LecturerPortalPage.jsx';
import { mockAuthService } from './services/auth.js';

export default function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [mockUsersList, setMockUsersList] = useState([]);
  const [showUsersModal, setShowUsersModal] = useState(false);

  const getTargetPage = (role) => {
    if (role === 'ADMIN') return 'admin_home';
    if (role === 'INSTRUCTOR' || role === 'LECTURER') return 'lecturer_home';
    return 'student_home';
  };

  useEffect(() => {
    // Kiểm tra phiên đăng nhập đã lưu trong LocalStorage
    const user = mockAuthService.getCurrentUser();
    
    if (user) {
      setCurrentUser(user);
      setCurrentPage(getTargetPage(user.role));
    } else {
      setCurrentPage('login');
    }
    setMockUsersList(mockAuthService.getAllUsers());

    const handleUnauthorized = () => {
      setCurrentUser(null);
      setCurrentPage('login');
      showToast('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
    };
    window.addEventListener('aives-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('aives-unauthorized', handleUnauthorized);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setMockUsersList(mockAuthService.getAllUsers());
    const roleTitle = user.role === 'ADMIN' ? 'Quản trị viên' : (user.role === 'INSTRUCTOR' || user.role === 'LECTURER') ? 'Thầy/Cô' : 'Thí sinh';
    showToast(`Chào mừng ${roleTitle} ${user.fullName || ''} đã đăng nhập thành công!`);
    setCurrentPage(getTargetPage(user.role));
  };

  const handleRegisterSuccess = (newUser) => {
    setCurrentUser(newUser);
    setMockUsersList(mockAuthService.getAllUsers());
    showToast(`Đăng ký tài khoản thành công cho ${newUser.fullName}!`);
    setCurrentPage('student_home');
  };

  const handleLogout = () => {
    mockAuthService.logout();
    setCurrentUser(null);
    showToast('Đã đăng xuất tài khoản an toàn.');
    setCurrentPage('login');
  };

  const handleResetData = () => {
    mockAuthService.resetMockData();
    setMockUsersList(mockAuthService.getAllUsers());
    showToast('Đã khôi phục dữ liệu Mock Users về mặc định!');
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2.5 border border-slate-700/80 backdrop-blur-md animate-fade-in">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Pages Routing */}
      {currentPage === 'login' && (
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onNavigate={(page) => setCurrentPage(page)}
        />
      )}

      {currentPage === 'register' && (
        <RegisterPage
          onRegisterSuccess={handleRegisterSuccess}
          onNavigate={(page) => setCurrentPage(page)}
        />
      )}

      {currentPage === 'student_home' && (
        <StudentPortalPage
          currentUser={currentUser}
          onLogout={handleLogout}
          onSwitchToAdmin={() => setCurrentPage('admin_home')}
          onSwitchToLecturer={() => setCurrentPage('lecturer_home')}
        />
      )}

      {currentPage === 'lecturer_home' && (
        <LecturerPortalPage
          currentUser={currentUser}
          onLogout={handleLogout}
          onSwitchPortal={(target) => setCurrentPage(target)}
        />
      )}

      {currentPage === 'admin_home' && (
        <AdminPortalPage
          currentUser={currentUser}
          onLogout={handleLogout}
          onSwitchToStudent={() => setCurrentPage('student_home')}
          onSwitchToLecturer={() => setCurrentPage('lecturer_home')}
        />
      )}

      {/* Mock Users Inspector Modal */}
      {showUsersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-lg">database</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">
                    Kho Tài Khoản Mock (localStorage)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Dữ liệu được lưu trong trình duyệt của bạn
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUsersModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="py-4 space-y-2 max-h-72 overflow-y-auto pr-1">
              {mockUsersList.map((u) => (
                <div
                  key={u.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 transition-all text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{u.fullName}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.role === 'INSTRUCTOR'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      ID: <b className="text-slate-700">{u.id}</b> • Pass: <code className="bg-white px-1 rounded border border-slate-200">{u.password}</code>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(u.id);
                      showToast(`Đã sao chép mã ${u.id} vào Clipboard!`);
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 bg-white hover:bg-blue-50 border border-slate-200 rounded-lg cursor-pointer"
                  >
                    Copy ID
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetData}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
              >
                Khôi phục mặc định ban đầu
              </button>
              <button
                type="button"
                onClick={() => setShowUsersModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
