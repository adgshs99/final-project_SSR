const express = require('express');
const router = express.Router();
const { pool } = require('../database/database');

router.get('/', function(req, res) {
  var userId = req.user_id;
  var page = 1;
  if (req.query.page) {
    page = parseInt(req.query.page);
    if (isNaN(page) || page < 1) {
      page = 1;
    }
  }
  var perPage = 10;
  var offset = (page - 1) * perPage;

  var where = " WHERE t.user_id = " + userId;
  var status = req.query.status;
  var category = req.query.category;

  if (status == "done") {
    where = where + " AND t.is_done = 1";
  } else {
    if (status == "notdone") {
      where = where + " AND t.is_done = 0";
    }
  }
  if (category) {
    where = where + " AND t.category_id = " + category;
  }

  var sqlCount = "SELECT COUNT(*) as count FROM tasks t" + where;
  pool.query(sqlCount, function(err, countResult) {
    var totalTasks = countResult[0].count;
    var totalPages = Math.ceil(totalTasks / perPage);

    var sql = "SELECT t.*, c.name as category_name FROM tasks t LEFT JOIN categories c ON t.category_id = c.id" + where + " ORDER BY t.due_date ASC LIMIT " + perPage + " OFFSET " + offset;
    pool.query(sql, function(err, results) {
      var sqlCat = "SELECT * FROM categories WHERE user_id = " + userId;
      pool.query(sqlCat, function(err, categories) {
        res.render('tasks/index', {
          tasks: results,
          page: page,
          totalPages: totalPages,
          status: status,
          category: category,
          categories: categories
        });
      });
    });
  });
});

router.get('/create', function(req, res) {
  var userId = req.user_id;
  var sql = "SELECT * FROM categories WHERE user_id = " + userId;
  pool.query(sql, function(err, categories) {
    res.render('tasks/create', { categories: categories, error: null });
  });
});

router.post('/create', function(req, res) {
  var userId = req.user_id;
  var description = req.body.description;
  var due_date = req.body.due_date;
  var category_id = req.body.category_id;
  if (!description || !due_date || !category_id) {
    var sql = "SELECT * FROM categories WHERE user_id = " + userId;
    pool.query(sql, function(err, categories) {
      res.render('tasks/create', { categories: categories, error: 'יש למלא את כל השדות' });
    });
    return;
  }
  var sql = "INSERT INTO tasks (user_id, category_id, description, due_date) VALUES (" + userId + ", " + category_id + ", '" + description + "', '" + due_date + "')";
  pool.query(sql, function() {
    res.redirect('/tasks');
  });
});

router.get('/edit/:id', function(req, res) {
  var userId = req.user_id;
  var taskId = req.params.id;
  var sqlTask = "SELECT * FROM tasks WHERE id = " + taskId + " AND user_id = " + userId;
  pool.query(sqlTask, function(err, tasks) {
    if (!tasks || tasks.length === 0) {
      return res.redirect('/tasks');
    }
    var sqlCat = "SELECT * FROM categories WHERE user_id = " + userId;
    pool.query(sqlCat, function(err, categories) {
      res.render('tasks/edit', { task: tasks[0], categories: categories, error: null });
    });
  });
});

router.post('/edit/:id', function(req, res) {
  var userId = req.user_id;
  var taskId = req.params.id;
  var description = req.body.description;
  var due_date = req.body.due_date;
  var category_id = req.body.category_id;
  var is_done = req.body.is_done;
  if (!description || !due_date || !category_id) {
    var sqlCat = "SELECT * FROM categories WHERE user_id = " + userId;
    pool.query(sqlCat, function(err, categories) {
      res.render('tasks/edit', { task: { id: taskId, description: description, due_date: due_date, category_id: category_id, is_done: is_done }, categories: categories, error: 'יש למלא את כל השדות' });
    });
    return;
  }
  var done = 0;
  if (is_done) {
    done = 1;
  }
  var sql = "UPDATE tasks SET description = '" + description + "', due_date = '" + due_date + "', category_id = " + category_id + ", is_done = " + done + " WHERE id = " + taskId + " AND user_id = " + userId;
  pool.query(sql, function() {
    res.redirect('/tasks');
  });
});

router.post('/delete/:id', function(req, res) {
  var userId = req.user_id;
  var taskId = req.params.id;
  var sql = "DELETE FROM tasks WHERE id = " + taskId + " AND user_id = " + userId;
  pool.query(sql, function() {
    res.redirect('/tasks');
  });
});

module.exports = router;