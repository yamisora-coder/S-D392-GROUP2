import React, { useState, useMemo } from 'react';
import { GraduationCap, Mail, Lock, Eye, EyeOff, User, Check, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { translations, Language } from '../../domain/i18n';
import { authApi } from '../../infrastructure/api/authApi';
import { AuthResponseData } from '../../domain/types';
import { LanguageSwitch } from '../components/LanguageSwitch';

interface RegisterPageProps {
  currentLang: Language;
  onToggleLang: (lang: Language) => void;
  onNavigateToLogin: () => void;
  onRegisterSuccess: (data: AuthResponseData) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  currentLang,
  onToggleLang,
  onNavigateToLogin,
  onRegisterSuccess,
}) => {
  const t = translations[currentLang];

  const [fullName, setFullName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Real-time password requirement analysis
  const passwordChecks = useMemo(() => {
    return {
      hasLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  const validCount = Object.values(passwordChecks).filter(Boolean).length;
  const strengthStatus = useMemo(() => {
    if (password.length === 0) return { label: '', color: '#94a3b8' };
    if (validCount <= 1) return { label: currentLang === 'vi' ? 'Yếu' : 'Weak', color: '#ef4444' };
    if (validCount <= 3) return { label: currentLang === 'vi' ? 'Trung bình' : 'Fair', color: '#f59e0b' };
    return { label: currentLang === 'vi' ? 'Mạnh' : 'Strong', color: '#10b981' };
  }, [validCount, password, currentLang]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !studentCode.trim() || !email.trim() || !password) {
      setErrorMessage(t.errorRequired);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t.errorPwdMismatch);
      return;
    }

    if (!agreedTerms) {
      setErrorMessage(t.errorTerms);
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.register({
        fullName: fullName.trim(),
        studentCode: studentCode.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });

      if (res.data) {
        localStorage.setItem('aives_token', res.data.token);
        localStorage.setItem('aives_user', JSON.stringify(res.data));
        onRegisterSuccess(res.data);
      } else {
        setErrorMessage(res.message || 'Registration failed.');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Registration failed. Please check your details.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card register-card">
        {/* Top Header Bar */}
        <div className="auth-top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.5px' }}>
              AIVES ACADEMIC
            </span>
          </div>
          <LanguageSwitch currentLang={currentLang} onToggle={onToggleLang} />
        </div>

        {/* Logo & Headline */}
        <div className="auth-header">
          <div className="logo-badge">
            <GraduationCap size={30} strokeWidth={2.2} />
          </div>
          <h1>{t.registerTitle}</h1>
          <p>{t.registerSubtitle}</p>
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
          {/* Full Name */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="reg-fullname">
                {t.fullNameLabel}
              </label>
            </div>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <User size={18} />
              </span>
              <input
                id="reg-fullname"
                type="text"
                className="form-input no-right-icon"
                placeholder={t.fullNamePlaceholder}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          </div>

          {/* 2-Column: Student Code & Email */}
          <div className="form-row">
            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="reg-code">
                  {t.studentCodeLabel}
                </label>
              </div>
              <div className="input-wrapper">
                <span className="input-icon-left">
                  <ShieldCheck size={18} />
                </span>
                <input
                  id="reg-code"
                  type="text"
                  className="form-input no-right-icon"
                  placeholder={t.studentCodePlaceholder}
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="reg-email">
                  {t.emailLabel}
                </label>
              </div>
              <div className="input-wrapper">
                <span className="input-icon-left">
                  <Mail size={18} />
                </span>
                <input
                  id="reg-email"
                  type="email"
                  className="form-input no-right-icon"
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>
          </div>

          {/* 2-Column: Password & Confirm Password */}
          <div className="form-row">
            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="reg-password">
                  {t.passwordLabel}
                </label>
              </div>
              <div className="input-wrapper">
                <span className="input-icon-left">
                  <Lock size={18} />
                </span>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
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

            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="reg-confirm-password">
                  {t.confirmPasswordLabel}
                </label>
              </div>
              <div className="input-wrapper">
                <span className="input-icon-left">
                  <Lock size={18} />
                </span>
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder={t.confirmPasswordPlaceholder}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Password Strength Requirements */}
          <div className="strength-card">
            <div className="strength-header">
              <span style={{ fontWeight: 600, color: '#334155' }}>{t.pwdRequirements}</span>
              {strengthStatus.label && (
                <span style={{ fontWeight: 700, color: strengthStatus.color }}>
                  {strengthStatus.label}
                </span>
              )}
            </div>
            <div className="strength-grid">
              <div className={`strength-item ${passwordChecks.hasLength ? 'valid' : ''}`}>
                <div className="circle-check">
                  {passwordChecks.hasLength && <Check size={9} strokeWidth={3} />}
                </div>
                <span>{t.pwdReqLength}</span>
              </div>
              <div className={`strength-item ${passwordChecks.hasUpper ? 'valid' : ''}`}>
                <div className="circle-check">
                  {passwordChecks.hasUpper && <Check size={9} strokeWidth={3} />}
                </div>
                <span>{t.pwdReqUpper}</span>
              </div>
              <div className={`strength-item ${passwordChecks.hasNumber ? 'valid' : ''}`}>
                <div className="circle-check">
                  {passwordChecks.hasNumber && <Check size={9} strokeWidth={3} />}
                </div>
                <span>{t.pwdReqNumber}</span>
              </div>
              <div className={`strength-item ${passwordChecks.hasSpecial ? 'valid' : ''}`}>
                <div className="circle-check">
                  {passwordChecks.hasSpecial && <Check size={9} strokeWidth={3} />}
                </div>
                <span>{t.pwdReqSpecial}</span>
              </div>
            </div>
          </div>

          {/* Honor Code & Terms Checkbox */}
          <div className="terms-row">
            <input
              type="checkbox"
              id="terms-check"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              style={{ marginTop: '2px', cursor: 'pointer' }}
            />
            <label htmlFor="terms-check" style={{ cursor: 'pointer' }}>
              {t.termsAgreement}
            </label>
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <span>{t.registering}</span>
            ) : (
              <>
                <span>{t.registerButton}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* SSO Divider */}
        <div className="sso-divider">
          <span>{t.orContinueWith}</span>
        </div>

        {/* Single SSO Button for Institutional Account */}
        <button
          type="button"
          className="btn-sso"
          onClick={() =>
            alert('Institutional Single Sign-On (Office 365 / Google Workspace) integration enabled.')
          }
        >
          <svg width="18" height="18" viewBox="0 0 21 21">
            <rect x="1" y="1" width="9" height="9" fill="#f25022" />
            <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
            <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
          </svg>
          <span>{t.ssoOffice365}</span>
        </button>

        {/* Footer Prompt */}
        <div className="auth-footer">
          <p className="auth-footer-prompt">
            {t.hasAccountPrompt}{' '}
            <a
              href="#login"
              onClick={(e) => {
                e.preventDefault();
                onNavigateToLogin();
              }}
            >
              {t.signInLink}
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
