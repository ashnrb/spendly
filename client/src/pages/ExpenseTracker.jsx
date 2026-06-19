import { useState, useEffect } from 'react';
import { useSettings } from '../SettingsContext';
import { getPeriod, shiftPeriod, inPeriod, periodLabel, toInputDate } from '../periods';

const API = import.meta.env.VITE_API_URL;
const PALETTE = ['#0c7a54', '#1f9e6e', '#5cb88f', '#caa53d', '#d2784a', '#4c6ef5', '#8a6fc4'];

function ExpenseTracker() {
  const { defaultPeriod } = useSettings();
  const periodType = defaultPeriod;

  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(toInputDate(new Date()));
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ amount: '', category: '', description: '' });
  const [summaryView, setSummaryView] = useState('bars');
  const [sortBy, setSortBy] = useState('newest');
  const [refDate, setRefDate] = useState(new Date());
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => { fetchExpenses(); fetchIncome(); }, []);
  useEffect(() => { setEditingIncome(false); }, [periodType, refDate]);

  function fetchExpenses() {
    fetch(`${API}/api/expenses`)
      .then((res) => res.json())
      .then((data) => setExpenses(data))
      .catch((err) => console.error('Error fetching expenses:', err));
  }

  function fetchIncome() {
    fetch(`${API}/api/income`)
      .then((res) => res.json())
      .then((data) => setIncome(data))
      .catch((err) => console.error('Error fetching income:', err));
  }

  function handleAdd() {
    if (!amount || !category) { alert('Amount and category are required'); return; }
    fetch(`${API}/api/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, category, description, date }),
    })
      .then((res) => res.json())
      .then(() => {
        fetchExpenses();
        setAmount(''); setCategory(''); setDescription('');
        setDate(toInputDate(new Date()));
      })
      .catch((err) => console.error('Error adding expense:', err));
  }

  function requestDelete(expense) { setPendingDelete(expense); }
  function cancelDelete() { setPendingDelete(null); }

  function confirmDelete() {
    fetch(`${API}/api/expenses/${pendingDelete.id}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then(() => { fetchExpenses(); setPendingDelete(null); })
      .catch((err) => console.error('Error deleting expense:', err));
  }

  function startEdit(expense) {
    setEditingId(expense.id);
    setEditValues({ amount: expense.amount, category: expense.category, description: expense.description || '' });
  }
  function cancelEdit() { setEditingId(null); }

  function handleUpdate(id) {
    fetch(`${API}/api/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editValues),
    })
      .then((res) => res.json())
      .then(() => { fetchExpenses(); setEditingId(null); })
      .catch((err) => console.error('Error updating expense:', err));
  }

  function saveIncome() {
    fetch(`${API}/api/income`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period_type: periodType, period_start: periodStartKey, amount: incomeInput || 0 }),
    })
      .then((res) => res.json())
      .then(() => { fetchIncome(); setEditingIncome(false); })
      .catch((err) => console.error('Error saving income:', err));
  }

  function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const period = getPeriod(refDate, periodType);
  const currentPeriod = getPeriod(new Date(), periodType);
  const isCurrent = period.start.getTime() === currentPeriod.start.getTime();
  const periodStartKey = toInputDate(period.start);

  const incomeRecord = income.find(
    (i) => i.period_type === periodType && toInputDate(new Date(i.period_start)) === periodStartKey
  );
  const incomeAmount = incomeRecord ? parseFloat(incomeRecord.amount) : 0;
  const incomeSet = Boolean(incomeRecord);

  function startEditIncome() {
    setIncomeInput(incomeSet ? String(incomeAmount) : '');
    setEditingIncome(true);
  }

  const periodExpenses = expenses.filter((e) => inPeriod(e.date_added, period));
  const total = periodExpenses.reduce((s, e) => s + parseFloat(e.amount), 0);
  const saved = incomeAmount - total;

  const sortedExpenses = [...periodExpenses].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.date_added) - new Date(a.date_added);
    if (sortBy === 'oldest') return new Date(a.date_added) - new Date(b.date_added);
    if (sortBy === 'high') return parseFloat(b.amount) - parseFloat(a.amount);
    if (sortBy === 'low') return parseFloat(a.amount) - parseFloat(b.amount);
    return 0;
  });

  const breakdownMap = {};
  for (const e of periodExpenses) {
    breakdownMap[e.category] = (breakdownMap[e.category] || 0) + parseFloat(e.amount);
  }
  const breakdown = Object.entries(breakdownMap)
    .map(([category, t]) => ({ category, total: t }))
    .sort((a, b) => b.total - a.total);

  const maxTotal = Math.max(...breakdown.map((b) => b.total), 0);
  const C = 2 * Math.PI * 60;
  let acc = 0;
  const segments = breakdown.map((item, idx) => {
    const dash = total ? (item.total / total) * C : 0;
    const seg = { category: item.category, value: item.total, color: PALETTE[idx % PALETTE.length], dash, offset: -acc };
    acc += dash;
    return seg;
  });

  const goPrev = () => setRefDate(shiftPeriod(period, periodType, -1).start);
  const goNext = () => setRefDate(shiftPeriod(period, periodType, 1).start);
  const goToday = () => setRefDate(new Date());

  return (
    <div className="page">
      <header className="header">
        <p className="eyebrow">Expense Tracker</p>
        <h1 className="title">Where your money goes</h1>
      </header>

      <div className="period-bar">
        <div className="period-nav">
          <button className="nav-btn" onClick={goPrev}>‹</button>
          <button className="nav-btn" onClick={goNext}>›</button>
          <span className="period-label">{periodLabel(period, periodType)}</span>
          {isCurrent && <span className="period-current">Current</span>}
          {!isCurrent && <button className="today-link" onClick={goToday}>Jump to current</button>}
        </div>
      </div>

      <div className="stats">
        <div className="stat-card">
          <div className="stat-label">Income</div>
          {editingIncome ? (
            <div className="income-edit">
              <input className="input" type="number" placeholder="0.00" value={incomeInput}
                onChange={(e) => setIncomeInput(e.target.value)} autoFocus />
              <button className="btn btn-primary" onClick={saveIncome}>Save</button>
              <button className="btn btn-ghost" onClick={() => setEditingIncome(false)}>Cancel</button>
            </div>
          ) : (
            <>
              <div className="stat-value">${incomeAmount.toFixed(2)}</div>
              <button className="link-btn" onClick={startEditIncome}>{incomeSet ? 'Edit income' : 'Set income'}</button>
            </>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-label">Spent</div>
          <div className="stat-value">${total.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Saved</div>
          {incomeSet ? (
            <div className={`stat-value ${saved >= 0 ? 'pos' : 'neg'}`}>${saved.toFixed(2)}</div>
          ) : (
            <div className="stat-value muted">—</div>
          )}
        </div>
      </div>

      <div className="card">
        <p className="card-title">Add an expense</p>
        <div className="form-row">
          <input className="input" type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <input className="input" type="text" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
          <input className="input" type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <input className="input input-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <button className="btn btn-primary" onClick={handleAdd}>Add</button>
        </div>
      </div>

      <div className="list-header">
        <p className="card-title">Expenses</p>
        <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="high">Amount: high to low</option>
          <option value="low">Amount: low to high</option>
        </select>
      </div>

      {sortedExpenses.length === 0 ? (
        <p className="empty" style={{ marginBottom: '20px' }}>No expenses this period.</p>
      ) : (
        <ul className="expense-list">
          {sortedExpenses.map((expense) => (
            <li className="expense-item" key={expense.id}>
              {editingId === expense.id ? (
                <div className="edit-row">
                  <input className="input" type="number" value={editValues.amount} onChange={(e) => setEditValues({ ...editValues, amount: e.target.value })} />
                  <input className="input" type="text" value={editValues.category} onChange={(e) => setEditValues({ ...editValues, category: e.target.value })} />
                  <input className="input" type="text" value={editValues.description} onChange={(e) => setEditValues({ ...editValues, description: e.target.value })} />
                  <button className="btn btn-primary" onClick={() => handleUpdate(expense.id)}>Save</button>
                  <button className="btn btn-ghost" onClick={cancelEdit}>Cancel</button>
                </div>
              ) : (
                <>
                  <div className="expense-main">
                    <div className="expense-cat">{expense.category}</div>
                    <div className="expense-desc">
                      {expense.description ? `${expense.description} · ` : ''}
                      <span className="expense-date">{formatDate(expense.date_added)}</span>
                    </div>
                  </div>
                  <div className="expense-amount">${parseFloat(expense.amount).toFixed(2)}</div>
                  <div className="actions">
                    <button className="btn btn-ghost" onClick={() => startEdit(expense)}>Edit</button>
                    <button className="btn btn-ghost danger" onClick={() => requestDelete(expense)}>Delete</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="card">
        <div className="card-head">
          <p className="card-title">Summary by category</p>
          <div className="view-toggle">
            <button className={summaryView === 'bars' ? 'active' : ''} onClick={() => setSummaryView('bars')}>Bars</button>
            <button className={summaryView === 'donut' ? 'active' : ''} onClick={() => setSummaryView('donut')}>Donut</button>
          </div>
        </div>

        {breakdown.length === 0 ? (
          <p className="empty">No expenses this period.</p>
        ) : summaryView === 'bars' ? (
          breakdown.map((item) => (
            <div className="summary-item" key={item.category}>
              <div className="summary-head">
                <span className="cat">{item.category}</span>
                <span className="amt">${item.total.toFixed(2)}</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: maxTotal ? `${(item.total / maxTotal) * 100}%` : '0%' }} />
              </div>
            </div>
          ))
        ) : (
          <div className="donut-wrap">
            <div className="donut">
              <svg width="160" height="160">
                <g transform="rotate(-90 80 80)">
                  {segments.map((s) => (
                    <circle key={s.category} cx="80" cy="80" r="60" fill="none" stroke={s.color} strokeWidth="22"
                      strokeDasharray={`${s.dash} ${C - s.dash}`} strokeDashoffset={s.offset} />
                  ))}
                </g>
              </svg>
              <div className="donut-center">
                <span className="dc-label">Total</span>
                <span className="dc-value">${total.toFixed(0)}</span>
              </div>
            </div>
            <ul className="legend">
              {segments.map((s) => (
                <li className="legend-item" key={s.category}>
                  <span className="swatch" style={{ background: s.color }} />
                  <span className="legend-cat">{s.category}</span>
                  <span className="legend-amt">${s.value.toFixed(2)} · {total ? Math.round((s.value / total) * 100) : 0}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {pendingDelete && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Delete expense?</div>
            <div className="modal-text">
              This will permanently delete{' '}
              <strong>{pendingDelete.category} — ${parseFloat(pendingDelete.amount).toFixed(2)}</strong>.
              This can't be undone.
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={cancelDelete}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpenseTracker;