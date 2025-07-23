const express = require('express');
const router = express.Router();
const { pool } = require('../database/database');

router.get('/', async (req, res) => {
  const userId = req.user_id;
  const promisePool = pool.promise();
  const [categories] = await promisePool.query(
    'SELECT * FROM categories WHERE user_id = ? ORDER BY name',
    [userId]
  );
  res.render('categories/index', { categories });
});

router.get('/create', (req, res) => {
  res.render('categories/create', { error: null });
});

router.post('/create', async (req, res) => {
  const userId = req.user_id;
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.render('categories/create', { error: 'יש להזין שם לקטגוריה' });
  }
  const promisePool = pool.promise();
  await promisePool.query(
    'INSERT INTO categories (user_id, name) VALUES (?, ?)',
    [userId, name.trim()]
  );
  res.redirect('/categories');
});

router.get('/edit/:id', async (req, res) => {
  const userId = req.user_id;
  const categoryId = req.params.id;
  const promisePool = pool.promise();
  const [categories] = await promisePool.query(
    'SELECT * FROM categories WHERE id = ? AND user_id = ?',
    [categoryId, userId]
  );
  if (categories.length === 0) {
    return res.redirect('/categories');
  }
  res.render('categories/edit', { category: categories[0], error: null });
});

router.post('/edit/:id', async (req, res) => {
  const userId = req.user_id;
  const categoryId = req.params.id;
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.render('categories/edit', { category: { id: categoryId, name }, error: 'יש להזין שם לקטגוריה' });
  }
  const promisePool = pool.promise();
  await promisePool.query(
    'UPDATE categories SET name = ? WHERE id = ? AND user_id = ?',
    [name.trim(), categoryId, userId]
  );
  res.redirect('/categories');
});

router.post('/delete/:id', async (req, res) => {
  const userId = req.user_id;
  const categoryId = req.params.id;
  const promisePool = pool.promise();
  const [tasks] = await promisePool.query(
    'SELECT COUNT(*) as count FROM tasks WHERE category_id = ?',
    [categoryId]
  );
  if (tasks[0].count > 0) {
    return res.redirect('/categories');
  }
  await promisePool.query(
    'DELETE FROM categories WHERE id = ? AND user_id = ?',
    [categoryId, userId]
  );
  res.redirect('/categories');
});

module.exports = router;