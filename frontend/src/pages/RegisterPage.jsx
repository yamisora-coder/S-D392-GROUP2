import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Validation helpers
const nameRegex   = /^[a-zA-ZÀ-ỹ\s]+$/;
const pwdRegex    = /[A-Z!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
const emailRegex  = /^[^\s@]+@(gmail\.com|edu\.vn)$/i;
const phoneRegex  = /^[0-9]{9,11}$/;

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '', password: '', confirmPassword: '',
    phone: '', email: '', role: 'STUDENT',
  });
  const [errors, setErrors]   = useState({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showCPwd,setShowCPwd]= useState(false);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    const n = form.fullName.trim();

    // Full name
    if (!n) {
      e.fullName = 'Full name is required.';
    } else if (/^\d/.test(n)) {
      e.fullName = 'Full name must not start with a number.';
    } else if (!nameRegex.test(n)) {
      e.fullName = 'Invalid account information: letters only, no numbers or special characters.';
    } else if (n.length > 16) {
      e.fullName = 'Invalid account information: max 16 characters.';
    }

    // Password
    if (!form.password) {
      e.password = 'Password is required.';
    } else if (form.password.length > 9) {
      e.password = 'Password must be max 9 characters.';
    } else if (!pwdRegex.test(form.password)) {
      e.password = 'Password must contain at least 1 uppercase letter or special character.';
    }

    // Confirm password
    if (!form.confirmPassword) {
      e.confirmPassword = 'Please confirm your password.';
    } else if (form.confirmPassword !== form.password) {
      e.confirmPassword = 'Passwords do not match.';
    }

    // Phone
    if (!form.phone) {
      e.phone = 'Phone number is required.';
    } else if (!phoneRegex.test(form.phone)) {
      e.phone = 'Invalid phone number (9–11 digits).';
    }

    // Email
    if (!form.email) {
      e.email = 'Email is required.';
    } else if (!emailRegex.test(form.email.trim())) {
      e.email = 'Email must end with @gmail.com or @edu.vn.';
    }

    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      // TODO: POST /api/users or /api/auth/register
      await new Promise((r) => setTimeout(r, 800)); // simulate API
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, maxWidth: 480, flexDirection: 'column', padding: 48, textAlign: 'center', gap: 20 }}>
          <div style={{ fontSize: 56 }}>🎉</div>
          <h2 style={styles.title}>Registration Successful!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Your account has been created. You can now sign in.
          </p>
          <button className="btn-primary" onClick={() => navigate('/login')}>
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create Account</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
          Fill in all fields to register your AIVES account.
        </p>

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          {/* Role select */}
          <div className="field">
            <label>I am a…</label>
            <select value={form.role} onChange={set('role')}>
              <option value="STUDENT">Student</option>
              <option value="INSTRUCTOR">Instructor</option>
            </select>
          </div>

          {/* Full name */}
          <div className="field">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={form.fullName}
              onChange={set('fullName')}
              className={errors.fullName ? 'invalid' : ''}
              maxLength={16}
            />
            <span className="err-msg">{errors.fullName}</span>
          </div>

          {/* Password */}
          <div className="field">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Min 1 uppercase or special char, max 9 chars"
                value={form.password}
                onChange={set('password')}
                className={errors.password ? 'invalid' : ''}
                maxLength={9}
                style={{ width: '100%', paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} style={styles.eye} tabIndex={-1}>
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
            <span className="err-msg">{errors.password}</span>
          </div>

          {/* Confirm Password */}
          <div className="field">
            <label>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCPwd ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                className={errors.confirmPassword ? 'invalid' : ''}
                maxLength={9}
                style={{ width: '100%', paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowCPwd(!showCPwd)} style={styles.eye} tabIndex={-1}>
                {showCPwd ? '🙈' : '👁️'}
              </button>
            </div>
            <span className="err-msg">{errors.confirmPassword}</span>
          </div>

          {/* Phone */}
          <div className="field">
            <label>Phone Number</label>
            <input
              type="tel"
              placeholder="Enter your phone number"
              value={form.phone}
              onChange={set('phone')}
              className={errors.phone ? 'invalid' : ''}
              maxLength={11}
            />
            <span className="err-msg">{errors.phone}</span>
          </div>

          {/* Email */}
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              placeholder="yourname@gmail.com or @edu.vn"
              value={form.email}
              onChange={set('email')}
              className={errors.email ? 'invalid' : ''}
            />
            <span className="err-msg">{errors.email}</span>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating Account…' : 'Confirm Registration'}
          </button>

          <div style={{ textAlign: 'center' }}>
            <button type="button" className="link-btn" onClick={() => navigate('/login')}>
              Already have an account? Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: '32px 24px',
  },
  card: {
    width: '100%', maxWidth: 520,
    background: 'rgba(10,22,40,0.9)',
    border: '1px solid rgba(96,165,250,0.18)',
    borderRadius: 20, padding: '44px 40px',
    boxShadow: '0 24px 80px rgba(0,0,0,.5)',
    backdropFilter: 'blur(12px)',
  },
  title: {
    fontSize: 26, fontWeight: 800, marginBottom: 4,
    background: 'linear-gradient(90deg,#fff,#60a5fa)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  eye: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 2,
  },
};
