import React, { useState, useEffect } from 'react';
import { LoginPage } from './presentation/pages/LoginPage';
import { RegisterPage } from './presentation/pages/RegisterPage';
import { DashboardPage } from './presentation/pages/DashboardPage';
import { Language } from './domain/i18n';
import { AuthResponseData } from './domain/types';
import { authApi } from './infrastructure/api/authApi';
import './presentation/styles/index.css';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'dashboard'>('login');
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    return (localStorage.getItem('aives_lang') as Language) || 'vi';
  });
  const [currentUser, setCurrentUser] = useState<AuthResponseData | null>(null);
  const [initializing, setInitializing] = useState(true);

  const handleLangToggle = (lang: Language) => {
    setCurrentLang(lang);
    localStorage.setItem('aives_lang', lang);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('aives_token');
      const storedUser = localStorage.getItem('aives_user');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser) as AuthResponseData;
          setCurrentUser(parsedUser);
          setCurrentView('dashboard');

          // Silently verify token with backend
          const meRes = await authApi.getMe();
          if (meRes.data) {
            // Updated user profile
            const updatedUser: AuthResponseData = {
              token: storedToken,
              tokenType: 'Bearer',
              userId: meRes.data.userId || meRes.data.id || parsedUser.userId,
              email: meRes.data.email,
              fullName: meRes.data.fullName,
              roles: meRes.data.roles || [meRes.data.role || 'STUDENT'],
            };
            setCurrentUser(updatedUser);
            localStorage.setItem('aives_user', JSON.stringify(updatedUser));
          }
        } catch (e) {
          console.warn('Session verification failed, resetting auth state:', e);
          localStorage.removeItem('aives_token');
          localStorage.removeItem('aives_user');
          setCurrentUser(null);
          setCurrentView('login');
        }
      }
      setInitializing(false);
    };

    initializeAuth();
  }, []);

  const handleLoginSuccess = (userData: AuthResponseData) => {
    setCurrentUser(userData);
    setCurrentView('dashboard');
  };

  const handleRegisterSuccess = (userData: AuthResponseData) => {
    setCurrentUser(userData);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
  };

  if (initializing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#64748b' }}>
        <span>Loading AIVES Examination Portal...</span>
      </div>
    );
  }

  if (currentView === 'dashboard' && currentUser) {
    return (
      <DashboardPage
        user={currentUser}
        currentLang={currentLang}
        onToggleLang={handleLangToggle}
        onLogout={handleLogout}
      />
    );
  }

  if (currentView === 'register') {
    return (
      <RegisterPage
        currentLang={currentLang}
        onToggleLang={handleLangToggle}
        onNavigateToLogin={() => setCurrentView('login')}
        onRegisterSuccess={handleRegisterSuccess}
      />
    );
  }

  return (
    <LoginPage
      currentLang={currentLang}
      onToggleLang={handleLangToggle}
      onNavigateToRegister={() => setCurrentView('register')}
      onLoginSuccess={handleLoginSuccess}
    />
  );
};

export default App;
