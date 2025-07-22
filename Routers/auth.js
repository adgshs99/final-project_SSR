const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { pool } = require('../database/database');

router.get('/register', (req, res) => {
  res.render('auth/register', { error: null });
});

router.post('/register', async (req, res) => {
  const { name, username, password } = req.body;
  if (!name || !username || !password) {
    return res.render('auth/register', { error: 'יש למלא את כל השדות' });
  }
  const promisePool = pool.promise();
  const [users] = await promisePool.query('SELECT id FROM users WHERE username = ?', [username]);
  if (users.length > 0) {
    return res.render('auth/register', { error: 'שם משתמש כבר קיים' });
  }
  const hash = await bcrypt.hash(password, 10);
  await promisePool.query('INSERT INTO users (name, username, password) VALUES (?, ?, ?)', [name, username, hash]);
  res.redirect('/login');
});

router.get('/login', (req, res) => {
  res.render('auth/login', { error: null });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const promisePool = pool.promise();
  const [users] = await promisePool.query('SELECT * FROM users WHERE username = ?', [username]);
  if (users.length === 0) {
    return res.render('auth/login', { error: 'שם משתמש או סיסמה שגויים' });
  }
  const user = users[0];
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.render('auth/login', { error: 'שם משתמש או סיסמה שגויים' });
  }
  req.session.userId = user.id;
  res.redirect('/dashboard');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;