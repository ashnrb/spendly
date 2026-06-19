import { useState, useEffect } from 'react';
import { useSettings } from '../SettingsContext';

const API = import.meta.env.VITE_API_URL;

function Profile() {
  const { name, defaultPeriod, currency, currencyOptions, theme, toggleTheme, saveSettings, loaded } = useSettings();

  const [nameInput, setNameInput] = useState(name);
  const [periodInput, setPeriodInput] = useState(defaultPeriod);
  const [currencyInput, setCurrencyInput] = useState(currency);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    setNameInput(name);
    setPeriodInput(defaultPeriod);
    setCurrencyInput(currency);
  }, [loaded]);

  function handleSave() {
    saveSettings({ name: nameInput, defaultPeriod: periodInput, currency: currencyInput });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  }

  function handleReset() {
    if (!window.confirm('This permanently deletes ALL expenses and income. Continue?')) return;
    fetch(`${API}/api/reset`, { method: 'POST' })
      .then((res) => res.json())
      .then(() => window.alert('All data cleared. Refresh other pages to see the change.'))
      .catch((err) => console.error('Error clearing data:', err));
  }

  const initial = (nameInput || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="page">
      <header className="header">
        <p className="eyebrow">Settings</p>
        <h1 className="title">Profile</h1>
      </header>

      <div className="card">
        <div className="profile-identity">
          <div className="avatar">{initial}</div>
          <div>
            <div className="profile-greeting">{name ? `Hi, ${name}` : 'Welcome'}</div>
            <div className="profile-sub">Manage your preferences</div>
          </div>
        </div>
      </div>

      <div className="card">
        <p className="card-title">Your details</p>
        <div className="field">
          <label className="field-label">Name</label>
          <input className="input" type="text" value={nameInput} placeholder="Your name"
            onChange={(e) => setNameInput(e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label">Default period</label>
          <select className="sort-select" value={periodInput} onChange={(e) => setPeriodInput(e.target.value)}>
            <option value="weekly">Weekly</option>
            <option value="fortnightly">Fortnightly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div className="field">
          <label className="field-label">Currency</label>
          <select className="sort-select" value={currencyInput} onChange={(e) => setCurrencyInput(e.target.value)}>
            {currencyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field-actions">
          <button className="btn btn-primary" onClick={handleSave}>Save changes</button>
          {savedMsg && <span className="saved-msg">Saved ✓</span>}
        </div>
      </div>

      <div className="card">
        <p className="card-title">Appearance</p>
        <div className="field-row">
          <span>Theme — currently {theme}</span>
          <button className="btn btn-ghost" onClick={toggleTheme}>
            {theme === 'light' ? 'Switch to dark' : 'Switch to light'}
          </button>
        </div>
      </div>

      <div className="card danger-zone">
        <p className="card-title">Danger zone</p>
        <div className="field-row">
          <span className="danger-text">Delete all expenses and income. This cannot be undone.</span>
          <button className="btn btn-danger" onClick={handleReset}>Clear all data</button>
        </div>
      </div>
    </div>
  );
}

export default Profile;