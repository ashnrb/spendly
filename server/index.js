const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json()); // lets us read JSON request bodies

// GET all expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM expenses ORDER BY date_added DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new expense
// POST a new expense (date optional — defaults to now)
app.post('/api/expenses', async (req, res) => {
  try {
    const { amount, category, description, date } = req.body;
    let result;
    if (date) {
      [result] = await db.query(
        'INSERT INTO expenses (amount, category, description, date_added) VALUES (?, ?, ?, ?)',
        [amount, category, description, date]
      );
    } else {
      [result] = await db.query(
        'INSERT INTO expenses (amount, category, description) VALUES (?, ?, ?)',
        [amount, category, description]
      );
    }
    res.status(201).json({ id: result.insertId, amount, category, description, date });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE an expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT (update) an expense
app.put('/api/expenses/:id', async (req, res) => {
  try {
    const { amount, category, description } = req.body;
    const [result] = await db.query(
      'UPDATE expenses SET amount = ?, category = ?, description = ? WHERE id = ?',
      [amount, category, description, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json({ id: req.params.id, amount, category, description });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET spending summary grouped by category
app.get('/api/summary', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT category, SUM(amount) AS total FROM expenses GROUP BY category ORDER BY total DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all income records
app.get('/api/income', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM income');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST (upsert) income for a period — insert, or update if it already exists
app.post('/api/income', async (req, res) => {
  try {
    const { period_type, period_start, amount } = req.body;
    await db.query(
      `INSERT INTO income (period_type, period_start, amount)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE amount = VALUES(amount)`,
      [period_type, period_start, amount]
    );
    res.json({ period_type, period_start, amount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET settings (always the single row, id = 1)
app.get('/api/settings', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM settings WHERE id = 1');
    res.json(rows[0] || { name: '', default_period: 'weekly', currency: 'AUD' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT settings (upsert the single row)
app.put('/api/settings', async (req, res) => {
  try {
    const { name, default_period, currency } = req.body;
    await db.query(
      `INSERT INTO settings (id, name, default_period, currency)
       VALUES (1, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), default_period = VALUES(default_period), currency = VALUES(currency)`,
      [name, default_period, currency]
    );
    res.json({ name, default_period, currency });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST reset — clear all financial data (for the danger zone)
app.post('/api/reset', async (req, res) => {
  try {
    await db.query('DELETE FROM expenses');
    await db.query('DELETE FROM income');
    res.json({ message: 'All data cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));