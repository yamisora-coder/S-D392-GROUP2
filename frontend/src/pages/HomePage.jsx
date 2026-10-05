import { useNavigate } from 'react-router-dom';
import aivesLogo from '../assets/aives-logo.png';

const ROLE_LABEL = {
  ADMIN:      'Admin',
  INSTRUCTOR: 'Instructor',
  STUDENT:    'Student',
};

const ROLE_COLOR = {
  ADMIN:      '#f59e0b',
  INSTRUCTOR: '#60a5fa',
  STUDENT:    '#34d399',
};

export default function HomePage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('aives_user') || 'null');
  const role     = user?.role     || 'STUDENT';
  const fullName = user?.fullName || 'User';

  const handleLogout = () => {
    localStorage.removeItem('aives_user');
    navigate('/login');
  };

  return (
    <div style={styles.shell}>
      {/* ── Top Bar ── */}
      <header style={styles.topBar}>
        {/* Left: Welcome */}
        <div style={styles.welcome}>
          Welcome,{' '}
          <span style={{ color: ROLE_COLOR[role], fontWeight: 700 }}>
            {ROLE_LABEL[role]}
          </span>{' '}
          <span style={{ color: '#fff', fontWeight: 600 }}>{fullName}</span>
        </div>

        {/* Center: Logo */}
        <div style={styles.logoCenter}>
          <img
            src={aivesLogo}
            alt="AIVES"
            style={{ height: 48 }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <span style={styles.logoText}>AIVES</span>
        </div>

        {/* Right: Logout */}
        <div style={styles.logoutWrap}>
          <button type="button" style={styles.logoutBtn} onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <main style={styles.main}>
        {role === 'ADMIN'      && <AdminView />}
        {role === 'INSTRUCTOR' && <InstructorView />}
        {role === 'STUDENT'    && <StudentView />}
      </main>
    </div>
  );
}

/* ── Role views ── */

function AdminView() {
  return (
    <Section title="Admin Dashboard" icon="🛠️">
      <Grid>
        <Card title="Users"     desc="Manage all accounts"         icon="👥" />
        <Card title="Subjects"  desc="Manage course subjects"       icon="📚" />
        <Card title="Questions" desc="Review & approve questions"   icon="❓" />
        <Card title="Exams"     desc="Configure exams"              icon="📋" />
        <Card title="Sessions"  desc="Monitor all exam sessions"    icon="📊" />
      </Grid>
    </Section>
  );
}

function InstructorView() {
  return (
    <Section title="Instructor Dashboard" icon="👨‍🏫">
      <Grid>
        <Card title="My Questions" desc="Create & manage your question bank" icon="❓" />
        <Card title="My Exams"     desc="Set up and schedule exams"          icon="📋" />
        <Card title="Sessions"     desc="Grade student sessions"              icon="✏️" />
        <Card title="Subjects"     desc="View available subjects"             icon="📚" />
      </Grid>
    </Section>
  );
}

function StudentView() {
  return (
    <Section title="Student Dashboard" icon="🎓">
      <Grid>
        <Card title="My Sessions"   desc="View your scheduled exams"       icon="📅" />
        <Card title="My Results"    desc="Check your scores and feedback"  icon="📊" />
        <Card title="Subjects"      desc="Browse available subjects"       icon="📚" />
      </Grid>
    </Section>
  );
}

function Section({ title, icon, children }) {
  return (
    <div>
      <h2 style={styles.sectionTitle}>{icon} {title}</h2>
      {children}
    </div>
  );
}

function Grid({ children }) {
  return <div style={styles.grid}>{children}</div>;
}

function Card({ title, desc, icon }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardIcon}>{icon}</div>
      <div>
        <div style={styles.cardTitle}>{title}</div>
        <div style={styles.cardDesc}>{desc}</div>
      </div>
    </div>
  );
}

/* ── Styles ── */
const styles = {
  shell: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    height: 64,
    background: 'rgba(5,5,16,0.95)',
    borderBottom: '1px solid rgba(96,165,250,0.15)',
    backdropFilter: 'blur(12px)',
    position: 'sticky', top: 0, zIndex: 100,
  },
  welcome: { flex: 1, fontSize: 14, color: 'var(--text-muted)' },
  logoCenter: {
    position: 'absolute', left: '50%', transform: 'translateX(-50%)',
    display: 'flex', alignItems: 'center', gap: 10,
  },
  logoText: {
    fontSize: 22, fontWeight: 900, letterSpacing: -1,
    background: 'linear-gradient(90deg,#60a5fa,#2563eb)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  logoutWrap: { flex: 1, display: 'flex', justifyContent: 'flex-end' },
  logoutBtn: {
    padding: '8px 20px',
    background: 'rgba(239,68,68,0.12)',
    border: '1.5px solid rgba(239,68,68,0.4)',
    borderRadius: 10, color: '#f87171',
    fontWeight: 700, fontSize: 13, cursor: 'pointer',
    transition: 'background .2s',
  },
  main: { flex: 1, padding: '40px 32px', maxWidth: 1000, margin: '0 auto', width: '100%' },
  sectionTitle: {
    fontSize: 22, fontWeight: 800, marginBottom: 24,
    background: 'linear-gradient(90deg,#fff,#60a5fa)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 16 },
  card: {
    display: 'flex', alignItems: 'center', gap: 16,
    background: 'rgba(10,22,40,0.8)',
    border: '1px solid rgba(96,165,250,0.15)',
    borderRadius: 14, padding: '20px 20px',
    cursor: 'pointer', transition: 'border-color .2s, transform .15s',
  },
  cardIcon: { fontSize: 30, flexShrink: 0 },
  cardTitle: { fontWeight: 700, fontSize: 15, marginBottom: 4 },
  cardDesc: { fontSize: 12, color: 'var(--text-muted)' },
};
