const { pool } = require('../database/database');

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

async function getUserById(id) {
  const promisePool = pool.promise();
  const [users] = await promisePool.query('SELECT * FROM users WHERE id = ?', [id]);
  return users[0];
}

module.exports = { requireAuth, getUserById };