import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { useSettings } from './SettingsContext';
//import NebulaBackground from './components/NebulaBackground';
//import DottedSurface from './components/DottedSurface';
import EtherealShadow from './components/EtherealShadow';
import ExpenseTracker from './pages/ExpenseTracker';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Profile from './pages/Profile';

function Icon({ name }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const icons = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" {...p} /><rect x="14" y="3" width="7" height="7" rx="1" {...p} /><rect x="14" y="14" width="7" height="7" rx="1" {...p} /><rect x="3" y="14" width="7" height="7" rx="1" {...p} /></>,
    expenses: <><rect x="2" y="5" width="20" height="14" rx="2" {...p} /><line x1="2" y1="10" x2="22" y2="10" {...p} /></>,
    history: <><circle cx="12" cy="12" r="9" {...p} /><polyline points="12 7 12 12 15 14" {...p} /></>,
    profile: <><circle cx="12" cy="8" r="4" {...p} /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" {...p} /></>,
    sun: <><circle cx="12" cy="12" r="4" {...p} /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" {...p} /></>,
    moon: <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" {...p} />,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24">{icons[name]}</svg>;
}

function App() {
  const { theme, toggleTheme } = useSettings();
  const linkClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');

  return (
    <>
      {theme === 'dark' && <EtherealShadow />}
      <div className="layout">
        <aside className="sidebar">
          <div className="brand">
            <span className="brand-logo" />
            <span className="brand-name">Spendly</span>
          </div>

          <nav className="nav">
            <NavLink to="/dashboard" className={linkClass}><Icon name="dashboard" /> <span>Dashboard</span></NavLink>
            <NavLink to="/expenses" className={linkClass}><Icon name="expenses" /> <span>Expense Tracker</span></NavLink>
            <NavLink to="/history" className={linkClass}><Icon name="history" /> <span>History</span></NavLink>
            <NavLink to="/profile" className={linkClass}><Icon name="profile" /> <span>Profile</span></NavLink>
          </nav>

          <button className="theme-toggle" onClick={toggleTheme}>
            <Icon name={theme === 'light' ? 'moon' : 'sun'} />
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </button>
        </aside>

        <main className="main">
          <Routes>
            <Route path="/" element={<Navigate to="/expenses" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/expenses" element={<ExpenseTracker />} />
            <Route path="/history" element={<History />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </>
  );
}

export default App;