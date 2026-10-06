import React, { useState } from 'react';
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { translations, Language } from '../../domain/i18n';
import { authApi } from '../../infrastructure/api/authApi';
import { AuthResponseData } from '../../domain/types';
import { LanguageSwitch } from '../components/LanguageSwitch';

interface LoginPageProps {
  currentLang: Language;
  onToggleLang: (lang: Language) => void;
  onNavigateToRegister: () => void;
  onLoginSuccess: (data: AuthResponseData) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  currentLang,
  onToggleLang,
  onNavigateToRegister,
  onLoginSuccess,
}) => {
  const t = translations[currentLang];
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim() || !password) {
      setErrorMessage(t.errorRequired);
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.login({
        identifier: identifier.trim(),
        password,
        rememberMe,
      });

      if (res.data) {
        localStorage.setItem('aives_token', res.data.token);
        localStorage.setItem('aives_user', JSON.stringify(res.data));
        onLoginSuccess(res.data);
      } else {
        setErrorMessage(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Authentication failed. Please check your student code or password.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSsoClick = (provider: string) => {
    alert(`${provider} Single Sign-On (SSO) integration is enabled in production environment.`);
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card login-card">
        {/* Top Header Bar */}
        <div className="auth-top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.5px' }}>
              AIVES
            </span>
          </div>
          <LanguageSwitch currentLang={currentLang} onToggle={onToggleLang} />
        </div>

        {/* Logo & Headline */}
        <div className="auth-header">
          <div className="logo-badge">
            <GraduationCap size={30} strokeWidth={2.2} />
          </div>
          <h1>{t.systemName}</h1>
          <p>{t.loginSubtitle}</p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="alert-box alert-error">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Identifier Input */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="login-identifier">
                {t.identifierLabel}
              </label>
            </div>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <Mail size={18} />
              </span>
              <input
                id="login-identifier"
                type="text"
                className="form-input no-right-icon"
                placeholder={t.identifierPlaceholder}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="login-password">
                {t.passwordLabel}
              </label>
            </div>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <Lock size={18} />
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder={t.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Options Row */}
          <div className="options-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>{t.rememberMe}</span>
            </label>
            <a
              href="#forgot-password"
              className="forgot-link"
              onClick={(e) => {
                e.preventDefault();
                alert(
                  currentLang === 'vi'
                    ? 'Vui lòng liên hệ phòng Khảo thí / Giảng viên hướng dẫn để cấp lại mật khẩu học vụ.'
                    : 'Please contact the Examination Office or Course Lecturer to reset your institutional password.'
                );
              }}
            >
              {t.forgotPassword}
            </a>
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <span>{t.signingIn}</span>
            ) : (
              <>
                <span>{t.signInButton}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* SSO Divider */}
        <div className="sso-divider">
          <span>{t.orContinueWith}</span>
        </div>

        {/* SSO Buttons */}
        <div className="sso-group">
          <button
            type="button"
            className="btn-sso"
            onClick={() => handleSsoClick('Microsoft 365')}
          >
            <svg width="18" height="18" viewBox="0 0 21 21">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            <span>{t.ssoOffice365}</span>
          </button>

          <button
            type="button"
            className="btn-sso"
            onClick={() => handleSsoClick('Google Workspace')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{t.ssoGoogle}</span>
          </button>
        </div>

        {/* Footer */}
        <div className="auth-footer">
          <p className="auth-footer-prompt">
            {t.noAccountPrompt}{' '}
            <a
              href="#register"
              onClick={(e) => {
                e.preventDefault();
                onNavigateToRegister();
              }}
            >
              {t.registerLink}
            </a>
          </p>

          <div className="auth-footer-links">
            <a href="#honor-code" onClick={(e) => e.preventDefault()}>
              {t.footerHonorCode}
            </a>
            <span>•</span>
            <a href="#privacy" onClick={(e) => e.preventDefault()}>
              {t.footerPrivacy}
            </a>
            <span>•</span>
            <a href="#support" onClick={(e) => e.preventDefault()}>
              {t.footerSupport}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
