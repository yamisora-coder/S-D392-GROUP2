import React, { useState } from 'react';
import { GraduationCap, LogOut, CheckCircle2, User, Mail, Shield, BookOpen, Clock, Calendar } from 'lucide-react';
import { translations, Language } from '../../domain/i18n';
import { authApi } from '../../infrastructure/api/authApi';
import { AuthResponseData } from '../../domain/types';
import { LanguageSwitch } from '../components/LanguageSwitch';

interface DashboardPageProps {
  user: AuthResponseData;
  currentLang: Language;
  onToggleLang: (lang: Language) => void;
  onLogout: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  currentLang,
  onToggleLang,
  onLogout,
}) => {
  const t = translations[currentLang];
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await authApi.logout();
    } catch (e) {
      console.warn('Logout API error:', e);
    } finally {
      localStorage.removeItem('aives_token');
      localStorage.removeItem('aives_user');
      onLogout();
    }
  };

  const initials = user.fullName
    ? user.fullName
        .split(' ')
        .map((p) => p[0])
        .slice(-2)
        .join('')
        .toUpperCase()
    : 'U';

  const roleName = user.roles && user.roles.length > 0 ? user.roles[0] : 'STUDENT';

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card dashboard-card">
        {/* Dashboard Top Header */}
        <div className="dashboard-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="logo-badge" style={{ width: '42px', height: '42px', marginBottom: 0 }}>
              <GraduationCap size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{t.systemName}</h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>{t.dashboardTitle}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LanguageSwitch currentLang={currentLang} onToggle={onToggleLang} />
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1px solid #fee2e2',
                background: '#fef2f2',
                color: '#b91c1c',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <LogOut size={16} />
              <span>{loggingOut ? '...' : t.logoutButton}</span>
            </button>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="user-profile-card">
          <div className="user-avatar">{initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{user.fullName}</h3>
              <span className="role-pill">{roleName.replace('ROLE_', '')}</span>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap', fontSize: '13px', color: '#64748b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Mail size={14} />
                <span>{user.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Shield size={14} />
                <span>ID: #{user.userId}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#059669', fontWeight: 600 }}>
                <CheckCircle2 size={14} />
                <span>{t.statusActive}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Viva Session Info */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} color="var(--primary)" />
              {t.activeVivaSession}
            </h4>
          </div>

          <div
            style={{
              padding: '28px 20px',
              borderRadius: '16px',
              border: '1.5px dashed #cbd5e1',
              background: '#f8fafc',
              textAlign: 'center',
            }}
          >
            <Calendar size={36} color="#94a3b8" style={{ marginBottom: '10px' }} />
            <h5 style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              {t.noActiveSessions}
            </h5>
            <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '440px', margin: '0 auto' }}>
              {t.roomNotice}
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div
          style={{
            borderTop: '1px solid #e2e8f0',
            paddingTop: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: '#94a3b8',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <span>AIVES • Human-in-the-Loop AI Viva Voce Platform</span>
          <div style={{ display: 'flex', gap: '14px' }}>
            <a href="#honor" onClick={(e) => e.preventDefault()} style={{ color: '#94a3b8', textDecoration: 'none' }}>
              {t.footerHonorCode}
            </a>
            <a href="#privacy" onClick={(e) => e.preventDefault()} style={{ color: '#94a3b8', textDecoration: 'none' }}>
              {t.footerPrivacy}
            </a>
            <a href="#support" onClick={(e) => e.preventDefault()} style={{ color: '#94a3b8', textDecoration: 'none' }}>
              {t.footerSupport}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
