import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const emailRegex = /^[^\s@]+@(gmail\.com|edu\.vn)$/i;

export default function ForgotPasswordPage() {
  const navigate  = useNavigate();
  const [email,   setEmail]   = useState('');
  const [errMsg,  setErrMsg]  = useState('');
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setErrMsg('Please enter your email.'); return; }
    if (!emailRegex.test(email.trim())) {
      setErrMsg('Email must end with @gmail.com or @edu.vn.');
      return;
    }
    setErrMsg('');
    setLoading(true);
    try {
      // TODO: POST /api/auth/forgot-password  { email }
      await new Promise((r) => setTimeout(r, 800));
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <button type="button" className="link-btn" onClick={() => navigate('/login')} style={{ marginBottom: 20, fontSize: 13 }}>
          ← Back to Sign In
        </button>

        <h2 style={styles.title}>Forgot Password</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>
          Enter the email linked to your account. We'll send you a reset link.
        </p>

        {sent ? (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 48 }}>📧</div>
            <p style={{ color: '#22c55e', fontWeight: 600 }}>Reset link sent!</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Check <strong>{email}</strong> and click the link to reset your password.
            </p>
            <button className="btn-primary" onClick={() => navigate('/login')}>
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            <div className="field">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="yourname@gmail.com or @edu.vn"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrMsg(''); }}
                className={errMsg ? 'invalid' : ''}
              />
              {errMsg && <span className="err-msg">{errMsg}</span>}
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}
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
};
