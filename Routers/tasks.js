const express = require('express');
const router = express.Router();
const { pool } = require('../database/database');

router.get('/', (req, res) => {
  const userId = req.user_id;
  let page = 1;
  if (req.query.page) {
    page = parseInt(req.query.page);
    if (isNaN(page) || page < 1) page = 1;
  }
  const perPage = 10;
  const offset = (page - 1) * perPage;

  const sqlCount = "SELECT COUNT(*) as count FROM tasks WHERE user_id = " + userId;
  pool.query(sqlCount, (err, countResult) => {
    const totalTasks = countResult[0].count;
    const totalPages = Math.ceil(totalTasks / perPage);

    const sql = "SELECT t.*, c.name as category_name FROM tasks t LEFT JOIN categories c ON t.category_id = c.id WHERE t.user_id = " + userId + " ORDER BY t.due_date ASC LIMIT " + perPage + " OFFSET " + offset;
    pool.query(sql, (err, results) => {
      res.render('tasks/index', { tasks: results, page, totalPages });
    });
  });
});

router.get('/create', (req, res) => {
  const userId = req.user_id;
  const sql = "SELECT * FROM categories WHERE user_id = " + userId;
  pool.query(sql, (err, categories) => {
    res.render('tasks/create', { categories, error: null });
  });
});

router.post('/create', (req, res) => {
  const userId = req.user_id;
  const { description, due_date, category_id } = req.body;
  if (!description || !due_date || !category_id) {
    const sql = "SELECT * FROM categories WHERE user_id = " + userId;
    pool.query(sql, (err, categories) => {
      res.render('tasks/create', { categories, error: 'יש למלא את כל השדות' });
    });
    return;
  }
  const sql = "INSERT INTO tasks (user_id, category_id, description, due_date) VALUES (" + userId + ", " + category_id + ", '" + description + "', '" + due_date + "')";
  pool.query(sql, () => {
    res.redirect('/tasks');
  });
});

router.get('/edit/:id', (req, res) => {
  const userId = req.user_id;
  const taskId = req.params.id;
  const sqlTask = "SELECT * FROM tasks WHERE id = " + taskId + " AND user_id = " + userId;
  pool.query(sqlTask, (err, tasks) => {
    if (!tasks || tasks.length === 0) {
      return res.redirect('/tasks');
    }
    const sqlCat = "SELECT * FROM categories WHERE user_id = " + userId;
    pool.query(sqlCat, (err, categories) => {
      res.render('tasks/edit', { task: tasks[0], categories, error: null });
    });
  });
});

router.post('/edit/:id', (req, res) => {
  const userId = req.user_id;
  const taskId = req.params.id;
  const { description, due_date, category_id, is_done } = req.body;
  if (!description || !due_date || !category_id) {
    const sqlCat = "SELECT * FROM categories WHERE user_id = " + userId;
    pool.query(sqlCat, (err, categories) => {
      res.render('tasks/edit', { task: { id: taskId, description, due_date, category_id, is_done }, categories, error: 'יש למלא את כל השדות' });
    });
    return;
  }
  const done = is_done ? 1 : 0;
  const sql = "UPDATE tasks SET description = '" + description + "', due_date = '" + due_date + "', category_id = " + category_id + ", is_done = " + done + " WHERE id = " + taskId + " AND user_id = " + userId;
  pool.query(sql, () => {
    res.redirect('/tasks');
  });
});

router.post('/delete/:id', (req, res) => {
  const userId = req.user_id;
  const taskId = req.params.id;
  const sql = "DELETE FROM tasks WHERE id = " + taskId + " AND user_id = " + userId;
  pool.query(sql, () => {
    res.redirect('/tasks');
  });
});

module.exports = router;