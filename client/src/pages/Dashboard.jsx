import { useState, useEffect } from 'react';
import { useSettings } from '../SettingsContext';
import { getPeriod, shiftPeriod, inPeriod, periodLabel, toInputDate } from '../periods';

function Dashboard() {
  const { name, defaultPeriod, formatMoney, symbol } = useSettings();
  const periodType = defaultPeriod;

  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/expenses').then((r) => r.json()).then(setExpenses).catch(console.error);
    fetch('http://localhost:5000/api/income').then((r) => r.json()).then(setIncome).catch(console.error);
  }, []);

  function spentFor(period) {
    return expenses.filter((e) => inPeriod(e.date_added, period)).reduce((s, e) => s + parseFloat(e.amount), 0);
  }
  function incomeFor(period) {
    const key = toInputDate(period.start);
    const rec = income.find((i) => i.period_type === periodType && toInputDate(new Date(i.period_start)) === key);
    return rec ? parseFloat(rec.amount) : 0;
  }
  function shortLabel(period) {
    if (periodType === 'monthly') return period.start.toLocaleDateString(undefined, { month: 'short' });
    return period.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  function formatDate(iso) {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  const current = getPeriod(new Date(), periodType);
  const curIncome = incomeFor(current);
  const curSpent = spentFor(current);
  const saved = curIncome - curSpent;
  const savingsRate = curIncome > 0 ? (saved / curIncome) * 100 : null;
  const periodExp = expenses.filter((e) => inPeriod(e.date_added, current));

  const periods = [];
  let cursor = current;
  for (let i = 0; i < 6; i++) { periods.push(cursor); cursor = shiftPeriod(cursor, periodType, -1); }
  periods.reverse();
  const trend = periods.map((p) => ({ period: p, spent: spentFor(p) }));
  const maxSpent = Math.max(...trend.map((t) => t.spent), 0);

  const completed = trend.slice(0, -1).filter((t) => t.spent > 0);
  const avgSpent = completed.length ? completed.reduce((s, t) => s + t.spent, 0) / completed.length : null;
  const biggest = periodExp.reduce((max, e) => (parseFloat(e.amount) > parseFloat(max?.amount ?? -1) ? e : max), null);

  const todayMid = new Date(); todayMid.setHours(0, 0, 0, 0);
  const DAY = 86400000;
  const totalDays = Math.round((current.end - current.start) / DAY) + 1;
  const dayNow = Math.min(Math.max(Math.round((todayMid - current.start) / DAY) + 1, 1), totalDays);
  const elapsedPct = (dayNow / totalDays) * 100;
  const spentPct = curIncome > 0 ? (curSpent / curIncome) * 100 : null;
  const onTrack = spentPct === null ? null : spentPct <= elapsedPct;
  const projected = curSpent > 0 && dayNow > 0 ? (curSpent / dayNow) * totalDays : 0;
  const projectionOver = curIncome > 0 && projected > curIncome;

  const cats = Object.entries(
    periodExp.reduce((m, e) => { m[e.category] = (m[e.category] || 0) + parseFloat(e.amount); return m; }, {})
  ).map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total);

  const recent = [...expenses].sort((a, b) => new Date(b.date_added) - new Date(a.date_added)).slice(0, 5);
  const firstName = name ? name.trim().split(' ')[0] : '';
  const unitWord = periodType === 'monthly' ? 'month' : periodType === 'fortnightly' ? 'fortnight' : 'week';

  // Blob sizing — diameter scales with value
  const vmax = Math.max(curIncome, curSpent, Math.abs(saved), 1);
  const blobSize = (v) => 110 + (Math.abs(v) / vmax) * 150;

  // Radial gauge (budget used)
  const gaugePct = spentPct === null ? 0 : Math.min(spentPct, 100);
  const R = 54;
  const CIRC = 2 * Math.PI * R;
  const dash = (gaugePct / 100) * CIRC;

  // Segmented bar: how many of 14 segments to fill for a category
  const SEG = 14;
  const segFilled = (total) => {
    if (curSpent <= 0 || total <= 0) return 0;
    return Math.max(1, Math.round((total / curSpent) * SEG));
  };

  return (
    <div className="page dash-page">
      <header className="dash-header">
        <div>
          <h1 className="title">{firstName ? `Hi, ${firstName}!` : 'Dashboard'}</h1>
          <p className="dash-sub">Here's your money this {unitWord}.</p>
        </div>
        <span className="dash-period-pill">{periodLabel(current, periodType)}</span>
      </header>

      <div className="bento">
        {/* HERO — blob viz */}
        <section className="bento-card bento-hero">
          <p className="card-title">Spending this {unitWord}</p>
          <div className="blob-stage">
            <div className="blob blob-income" style={{ width: blobSize(curIncome), height: blobSize(curIncome) }}>
              <span className="blob-label"><b>{formatMoney(curIncome)}</b>income</span>
            </div>
            <div className="blob blob-spent" style={{ width: blobSize(curSpent), height: blobSize(curSpent) }}>
              <span className="blob-label"><b>{formatMoney(curSpent)}</b>spent</span>
            </div>
            <div className="blob blob-saved" style={{ width: blobSize(saved), height: blobSize(saved) }}>
              <span className="blob-label"><b>{formatMoney(saved)}</b>saved</span>
            </div>
          </div>
          <div className="hero-chips">
            <div className="chip"><span className="chip-label">Avg / {unitWord}</span><span className="chip-val">{avgSpent !== null ? formatMoney(avgSpent) : '—'}</span></div>
            <div className="chip"><span className="chip-label">Biggest</span><span className="chip-val">{biggest ? formatMoney(biggest.amount) : '—'}</span></div>
            <div className="chip" title="Estimated total spend by the end of this period, based on your pace so far. A rough run-rate, not a guarantee.">
  <span className="chip-label">Projected <span className="est-badge">est.</span></span>
  <span className={`chip-val ${projectionOver ? 'neg' : ''}`}>{projected > 0 ? formatMoney(projected) : '—'}</span>
</div>
          </div>
        </section>

        {/* DARK accent card — saved + mini trend */}
        <section className="bento-card bento-dark">
          <p className="dark-label">Saved this {unitWord}</p>
          {curIncome > 0 ? (
            <>
              <div className="dark-value">{formatMoney(saved)}</div>
              <div className="dark-rate">{savingsRate.toFixed(0)}% of income kept</div>
            </>
          ) : (
            <div className="dark-value muted">—</div>
          )}
          <div className="dark-trend">
            {trend.map((t, i) => (
              <div key={i} className="dt-bar" style={{ height: `${maxSpent ? Math.max((t.spent / maxSpent) * 100, 4) : 4}%`, opacity: i === trend.length - 1 ? 1 : 0.5 }} />
            ))}
          </div>
          <p className="dark-foot">spending, last 6 {unitWord}s</p>
        </section>

        {/* GAUGE — budget used */}
        <section className="bento-card bento-gauge">
          <p className="card-title">Budget used</p>
          <div className="gauge-wrap">
            <svg width="128" height="128" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r={R} fill="none" stroke="var(--bg)" strokeWidth="14" />
              <circle cx="64" cy="64" r={R} fill="none"
                stroke={gaugePct >= 100 ? 'var(--danger)' : 'var(--accent)'} strokeWidth="14" strokeLinecap="round"
                strokeDasharray={`${dash} ${CIRC - dash}`} transform="rotate(-90 64 64)" />
            </svg>
            <div className="gauge-center">
              {spentPct === null ? (
                <><span className="gauge-num">{formatMoney(curSpent)}</span><span className="gauge-cap">spent</span></>
              ) : (
                <><span className="gauge-num">{Math.round(spentPct)}%</span><span className="gauge-cap">of income</span></>
              )}
            </div>
          </div>
          {spentPct !== null && (
            <p className={`pace-text ${onTrack ? 'pace-ok' : 'pace-warn'}`}>
              {onTrack ? `On track · ${Math.round(elapsedPct)}% through` : `Ahead of pace · ${Math.round(elapsedPct)}% through`}
            </p>
          )}
        </section>

        {/* CATEGORIES — segmented bars */}
        <section className="bento-card bento-cats">
          <p className="card-title">Top categories</p>
          {cats.length === 0 ? (
            <p className="empty">No expenses this {unitWord}.</p>
          ) : (
            cats.slice(0, 5).map((c) => {
              const filled = segFilled(c.total);
              return (
                <div className="seg-row" key={c.category}>
                  <div className="seg-info">
                    <span className="seg-cat">{c.category}</span>
                    <span className="seg-amt">{formatMoney(c.total)}</span>
                  </div>
                  <div className="seg-bars">
                    {Array.from({ length: SEG }).map((_, i) => (
                      <span key={i} className={`seg ${i < filled ? 'on' : ''}`} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* RECENT — full width */}
        <section className="bento-card bento-recent">
          <p className="card-title">Recent transactions</p>
          {recent.length === 0 ? (
            <p className="empty">No expenses yet.</p>
          ) : (
            <ul className="mini-list">
              {recent.map((e) => (
                <li className="mini-item" key={e.id}>
                  <div>
                    <div className="mini-cat">{e.category}</div>
                    <div className="mini-date">{e.description ? `${e.description} · ` : ''}{formatDate(e.date_added)}</div>
                  </div>
                  <div className="mini-amt">{formatMoney(e.amount)}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;