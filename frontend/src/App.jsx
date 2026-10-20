import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import StudentPortalPage from './pages/StudentPortalPage.jsx';
import AdminPortalPage from './pages/AdminPortalPage.jsx';
import LecturerPortalPage from './pages/LecturerPortalPage.jsx';
import { api } from './services/api.js';
import { authService } from './services/auth.js';

export default function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const getTargetPage = (role) => {
    if (role === 'ADMIN') return 'admin_home';
    if (role === 'INSTRUCTOR') return 'lecturer_home';
    return 'student_home';
  };

  useEffect(() => {
    let active = true;
    const user = authService.getCurrentUser();
    if (!user || !localStorage.getItem('aives_token')) {
      setAuthReady(true);
      return () => { active = false; };
    }
    api.me().then(db => {
      if (!active) return;
      const fresh = { ...user, role: db.role, isAdmin: db.isAdmin };
      setCurrentUser(fresh); setCurrentPage(getTargetPage(fresh.role));
    }).catch(() => { if (active) authService.logout(); })
      .finally(() => { if (active) setAuthReady(true); });
    return () => { active = false; };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    const roleTitle = user.role === 'ADMIN' ? 'Quản trị viên' : user.role === 'INSTRUCTOR' ? 'Thầy/Cô' : 'Thí sinh';
    showToast(`Chào mừng ${roleTitle} ${user.fullName || ''} đã đăng nhập thành công!`);
    setCurrentPage(getTargetPage(user.role));
  };

  const handleRegisterSuccess = (newUser) => {
    setCurrentUser(newUser);
    showToast(`Đăng ký tài khoản thành công cho ${newUser.fullName}!`);
    setCurrentPage('student_home');
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    showToast('Đã đăng xuất tài khoản an toàn.');
    setCurrentPage('login');
  };

  if (!authReady) return <p className="p-8">Đang kiểm tra phiên đăng nhập…</p>;

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

    </div>
  );
}
