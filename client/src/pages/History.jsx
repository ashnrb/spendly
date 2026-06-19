import { useState, useEffect } from 'react';
import { useSettings } from '../SettingsContext';
import { getPeriod, shiftPeriod, inPeriod, periodLabel, toInputDate } from '../periods';

const API = import.meta.env.VITE_API_URL;

function History() {
  const { defaultPeriod, formatMoney } = useSettings();
  const periodType = defaultPeriod;

  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [expandedKey, setExpandedKey] = useState(null);
  const [count, setCount] = useState(8);

  useEffect(() => {
    fetch(`${API}/api/expenses`).then((r) => r.json()).then(setExpenses).catch(console.error);
    fetch(`${API}/api/income`).then((r) => r.json()).then(setIncome).catch(console.error);
  }, []);

  function spentFor(period) {
    return expenses.filter((e) => inPeriod(e.date_added, period)).reduce((s, e) => s + parseFloat(e.amount), 0);
  }
  function incomeFor(period) {
    const key = toInputDate(period.start);
    const rec = income.find((i) => i.period_type === periodType && toInputDate(new Date(i.period_start)) === key);
    return rec ? parseFloat(rec.amount) : 0;
  }
  function expensesFor(period) {
    return expenses.filter((e) => inPeriod(e.date_added, period));
  }
  function formatDate(iso) {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  const current = getPeriod(new Date(), periodType);
  const periods = [];
  let cursor = current;
  for (let i = 0; i < count; i++) { periods.push(cursor); cursor = shiftPeriod(cursor, periodType, -1); }

  return (
    <div className="page">
      <header className="header">
        <p className="eyebrow">Past periods</p>
        <h1 className="title">History</h1>
        <p className="profile-sub" style={{ marginTop: '6px' }}>
          Your {periodType.replace('ly', '')}s, newest first
        </p>
      </header>

      <div className="history-list">
        {periods.map((period) => {
          const key = `${periodType}-${toInputDate(period.start)}`;
          const inc = incomeFor(period);
          const spent = spentFor(period);
          const saved = inc - spent;
          const incSet = inc > 0;
          const isCurrent = period.start.getTime() === current.start.getTime();
          const isOpen = expandedKey === key;

          const periodExp = expensesFor(period);
          const cats = Object.entries(
            periodExp.reduce((m, e) => { m[e.category] = (m[e.category] || 0) + parseFloat(e.amount); return m; }, {})
          ).map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total);
          const catMax = Math.max(...cats.map((c) => c.total), 0);
          const rows = [...periodExp].sort((a, b) => new Date(b.date_added) - new Date(a.date_added));

          return (
            <div className={`history-card ${isOpen ? 'open' : ''}`} key={key}>
              <button className="history-row" onClick={() => setExpandedKey(isOpen ? null : key)}>
                <div className="hr-left">
                  <span className="hr-chevron">{isOpen ? '▾' : '▸'}</span>
                  <div>
                    <div className="hr-label">
                      {periodLabel(period, periodType)}
                      {isCurrent && <span className="period-current" style={{ marginLeft: 8 }}>Current</span>}
                    </div>
                    <div className="hr-meta">{periodExp.length} {periodExp.length === 1 ? 'expense' : 'expenses'}</div>
                  </div>
                </div>
                <div className="hr-right">
                  <div className="hr-stat"><span className="hr-stat-label">Spent</span><span className="hr-stat-val">{formatMoney(spent)}</span></div>
                  <div className="hr-stat">
                    <span className="hr-stat-label">Saved</span>
                    {incSet ? <span className={`hr-stat-val ${saved >= 0 ? 'pos' : 'neg'}`}>{formatMoney(saved)}</span> : <span className="hr-stat-val muted">—</span>}
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="history-detail">
                  {periodExp.length === 0 ? (
                    <p className="empty">No expenses in this period.</p>
                  ) : (
                    <>
                      <div className="hd-summary">
                        <div className="hd-stat"><span className="hd-label">Income</span><span className="hd-val">{incSet ? formatMoney(inc) : '—'}</span></div>
                        <div className="hd-stat"><span className="hd-label">Spent</span><span className="hd-val">{formatMoney(spent)}</span></div>
                        <div className="hd-stat"><span className="hd-label">Saved</span><span className={`hd-val ${incSet ? (saved >= 0 ? 'pos' : 'neg') : 'muted'}`}>{incSet ? formatMoney(saved) : '—'}</span></div>
                      </div>

                      <p className="hd-section">By category</p>
                      {cats.map((c) => (
                        <div className="summary-item" key={c.category}>
                          <div className="summary-head">
                            <span className="cat">{c.category}</span>
                            <span className="amt">{formatMoney(c.total)}</span>
                          </div>
                          <div className="bar-track">
                            <div className="bar-fill" style={{ width: catMax ? `${(c.total / catMax) * 100}%` : '0%' }} />
                          </div>
                        </div>
                      ))}

                      <p className="hd-section">Transactions</p>
                      <ul className="mini-list">
                        {rows.map((e) => (
                          <li className="mini-item" key={e.id}>
                            <div>
                              <div className="mini-cat">{e.category}</div>
                              <div className="mini-date">{e.description ? `${e.description} · ` : ''}{formatDate(e.date_added)}</div>
                            </div>
                            <div className="mini-amt">{formatMoney(e.amount)}</div>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <button className="btn btn-ghost" onClick={() => setCount(count + 8)}>Show older</button>
      </div>
    </div>
  );
}

export default History;