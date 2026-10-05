import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import aivesLogo from '../assets/aives-logo.png';

const MAX_ATTEMPTS  = 5;
const LOCKOUT_MINS  = 30;
const STORAGE_KEY   = 'aives_login_lock';

// Validation
const isEmail    = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidName= (v) => v.length <= 16 && /^[a-zA-ZÀ-ỹ\s]+$/.test(v);
const isValidPwd = (v) => v.length >= 1 && v.length <= 9;

export default function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password,   setPassword]   = useState('');
  const [showPwd,    setShowPwd]     = useState(false);
  const [error,      setError]       = useState('');
  const [attempts,   setAttempts]    = useState(0);
  const [lockedUntil,setLockedUntil] = useState(null);
  const [countdown,  setCountdown]   = useState(0);
  const [loading,    setLoading]     = useState(false);

  // Load lockout state from localStorage on mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved) {
      const until = new Date(saved.until);
      if (until > new Date()) {
        setLockedUntil(until);
        setAttempts(saved.attempts);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Countdown timer while locked
  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const secs = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (secs <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        setError('');
        localStorage.removeItem(STORAGE_KEY);
      } else {
        setCountdown(secs);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lockedUntil) return;

    // Field-level validation
    if (!identifier.trim()) { setError('Please enter your name or email.'); return; }
    if (!password)           { setError('Please enter your password.');      return; }

    const identIsEmail = isEmail(identifier.trim());
    if (!identIsEmail && !isValidName(identifier.trim())) {
      setError('Name: max 16 characters, letters only (no numbers or special characters).');
      return;
    }
    if (!isValidPwd(password)) {
      setError('Password must be 1–9 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // TODO: Replace with real API call to Spring Boot backend
      // const res = await fetch('/api/auth/login', { method:'POST', ... });
      // Simulate login — match against seeded users (DataInitializer)
      const DEMO_USERS = [
        { identifier: 'admin',    email: 'admin@aives.edu.vn',      password: 'Admin12345', role: 'ADMIN',      fullName: 'System Admin' },
        { identifier: 'nhitran',  email: 'nhitran@edu.vn',          password: 'Nhi123',     role: 'INSTRUCTOR', fullName: 'Nhi Tran' },
        { identifier: 'Bao',      email: 'bao@student.edu.vn',      password: 'B1234',      role: 'STUDENT',    fullName: 'Bao' },
      ];

      const found = DEMO_USERS.find(u =>
        (u.identifier.toLowerCase() === identifier.trim().toLowerCase() ||
         u.email.toLowerCase()      === identifier.trim().toLowerCase()) &&
        u.password === password
      );

      if (found) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem('aives_user', JSON.stringify({ role: found.role, fullName: found.fullName }));
        navigate('/home');
        return;
      }

      // Wrong credentials
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        const until = new Date(Date.now() + LOCKOUT_MINS * 60 * 1000);
        setLockedUntil(until);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ until: until.toISOString(), attempts: newAttempts }));
        setError(`Too many failed attempts. Account locked for ${LOCKOUT_MINS} minutes.`);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ until: null, attempts: newAttempts }));
        setError(`Invalid credentials. Attempt ${newAttempts}/${MAX_ATTEMPTS}.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    // TODO: integrate Google OAuth
    alert('Google login coming soon.');
  };

  const isLocked = !!lockedUntil;

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* LEFT — Logo */}
        <div style={styles.left}>
          <div className="logo-wrap">
            <img
              src={aivesLogo}
              alt="AIVES Logo"
              className="logo-img"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            {/* fallback text logo if image missing */}
            <div style={styles.logoFallback}>AIVES</div>
            <div className="logo-shadow" />
          </div>
          <p style={styles.tagline}>AI-powered Viva Exam System</p>
        </div>

        {/* RIGHT — Form */}
        <div style={styles.right}>
          <h2 style={styles.title}>Sign In</h2>
          <p style={styles.sub}>Welcome back! Please enter your credentials.</p>

          <form onSubmit={handleSubmit} style={styles.form} noValidate>

            {/* Alert */}
            {error && (
              <div className="alert alert-error">{error}</div>
            )}
            {isLocked && (
              <div className="alert alert-error" style={{ textAlign: 'center', fontSize: 15 }}>
                🔒 Locked — Try again in <strong>{formatTime(countdown)}</strong>
              </div>
            )}

            <div className="field">
              <label>Full Name or Email</label>
              <input
                type="text"
                placeholder="Enter your name or email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isLocked}
                maxLength={100}
              />
            </div>

            <div className="field">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLocked}
                  maxLength={9}
                  style={{ width: '100%', paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  style={styles.eyeBtn}
                  tabIndex={-1}
                >
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Max 9 characters</span>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isLocked || loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <div className="divider">or</div>

            <button type="button" className="btn-google" onClick={handleGoogle}>
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>

            <div style={styles.bottomLinks}>
              <button type="button" className="link-btn" onClick={() => navigate('/register')}>
                Create Account
              </button>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
              <button type="button" className="link-btn" onClick={() => navigate('/forgot-password')}>
                Forgot Password?
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  card: {
    display: 'flex',
    width: '100%',
    maxWidth: 860,
    minHeight: 520,
    background: 'rgba(10,22,40,0.85)',
    border: '1px solid rgba(96,165,250,0.18)',
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 24px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(37,99,235,.12)',
    backdropFilter: 'blur(12px)',
  },
  left: {
    flex: '0 0 42%',
    background: 'linear-gradient(160deg, #0d1f40 0%, #081226 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: '40px 30px',
    borderRight: '1px solid rgba(96,165,250,0.12)',
  },
  logoFallback: {
    fontSize: 52,
    fontWeight: 900,
    background: 'linear-gradient(135deg, #60a5fa, #2563eb)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: -2,
    marginTop: 8,
  },
  tagline: {
    fontSize: 12,
    color: 'var(--text-muted)',
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  right: {
    flex: 1,
    padding: '48px 40px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    marginBottom: 6,
    background: 'linear-gradient(90deg, #fff, #60a5fa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  sub: {
    fontSize: 13,
    color: 'var(--text-muted)',
    marginBottom: 28,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
    lineHeight: 1,
    padding: 2,
  },
  bottomLinks: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
};
