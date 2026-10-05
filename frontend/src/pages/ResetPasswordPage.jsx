import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const pwdRegex = /[A-Z!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [form,   setForm]   = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [done,   setDone]   = useState(false);
  const [loading,setLoading]= useState(false);
  const [showP,  setShowP]  = useState(false);
  const [showC,  setShowC]  = useState(false);

  const set = (f) => (e) => {
    setForm((p) => ({ ...p, [f]: e.target.value }));
    setErrors((p) => ({ ...p, [f]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.password) {
      e.password = 'Password is required.';
    } else if (form.password.length > 9) {
      e.password = 'Password must be max 9 characters.';
    } else if (!pwdRegex.test(form.password)) {
      e.password = 'Password must contain at least 1 uppercase letter or special character.';
    }

    if (!form.confirm) {
      e.confirm = 'Please confirm your password.';
    } else if (form.confirm !== form.password) {
      e.confirm = 'Passwords do not match.';
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      // TODO: POST /api/auth/reset-password  { token (from URL), newPassword }
      await new Promise((r) => setTimeout(r, 700));
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 52 }}>✅</div>
            <h2 style={styles.title}>Password Updated!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Your password has been reset successfully. Please sign in with your new password.
            </p>
            <button className="btn-primary" onClick={() => navigate('/login')}>
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Set New Password</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>
          Choose a strong new password for your account.
        </p>

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <div className="field">
            <label>New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showP ? 'text' : 'password'}
                placeholder="Min 1 uppercase or special char, max 9 chars"
                value={form.password}
                onChange={set('password')}
                className={errors.password ? 'invalid' : ''}
                maxLength={9}
                style={{ width: '100%', paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowP(!showP)} style={styles.eye} tabIndex={-1}>
                {showP ? '🙈' : '👁️'}
              </button>
            </div>
            <span className="err-msg">{errors.password}</span>
          </div>

          <div className="field">
            <label>Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showC ? 'text' : 'password'}
                placeholder="Re-enter your new password"
                value={form.confirm}
                onChange={set('confirm')}
                className={errors.confirm ? 'invalid' : ''}
                maxLength={9}
                style={{ width: '100%', paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowC(!showC)} style={styles.eye} tabIndex={-1}>
                {showC ? '🙈' : '👁️'}
              </button>
            </div>
            <span className="err-msg">{errors.confirm}</span>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Updating…' : 'Confirm New Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    width: '100%', maxWidth: 440,
    background: 'rgba(10,22,40,0.9)',
    border: '1px solid rgba(96,165,250,0.18)',
    borderRadius: 20, padding: '44px 40px',
    boxShadow: '0 24px 80px rgba(0,0,0,.5)',
    backdropFilter: 'blur(12px)',
  },
  title: {
    fontSize: 26, fontWeight: 800, marginBottom: 6,
    background: 'linear-gradient(90deg,#fff,#60a5fa)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  eye: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 2,
  },
};
