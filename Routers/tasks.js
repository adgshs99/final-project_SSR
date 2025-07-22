const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { pool } = require('../database/database');

// הצגת רשימת המשימות עם סינון ודפדוף
router.get('/', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    
    // פרמטרים לסינון
    const status = req.query.status || 'all'; // all, done, pending
    const categoryId = req.query.category || 'all';
    
    let whereConditions = ['t.user_id = ?'];
    let queryParams = [req.session.userId];
    
    // סינון לפי סטטוס
    if (status === 'done') {
      whereConditions.push('t.is_done = 1');
    } else if (status === 'pending') {
      whereConditions.push('t.is_done = 0');
    }
    
    // סינון לפי קטגוריה
    if (categoryId !== 'all') {
      whereConditions.push('t.category_id = ?');
      queryParams.push(categoryId);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // ספירת המשימות הכוללת
    const [countResult] = await pool.promise().query(
      `SELECT COUNT(*) as total FROM tasks t WHERE ${whereClause}`,
      queryParams
    );
    
    const totalTasks = countResult[0].total;
    const totalPages = Math.ceil(totalTasks / limit);
    
    // קבלת המשימות עם פרטי הקטגוריה
    const [tasks] = await pool.promise().query(
      `SELECT t.*, c.name as category_name 
       FROM tasks t 
       LEFT JOIN categories c ON t.category_id = c.id 
       WHERE ${whereClause} 
       ORDER BY t.due_date ASC, t.id DESC 
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );
    
    // קבלת כל הקטגוריות של המשתמש לסינון
    const [categories] = await pool.promise().query(
      'SELECT * FROM categories WHERE user_id = ? ORDER BY name',
      [req.session.userId]
    );
    
    res.render('tasks/index', {
      tasks,
      categories,
      currentPage: page,
      totalPages,
      totalTasks,
      currentStatus: status,
      currentCategory: categoryId,
      error: req.session.error,
      success: req.session.success
    });
    
    delete req.session.error;
    delete req.session.success;
    
  } catch (error) {
    console.error('שגיאה בטעינת משימות:', error);
    req.session.error = 'שגיאה בטעינת המשימות';
    res.redirect('/dashboard');
  }
});

// עמוד יצירת משימה חדשה
router.get('/create', requireAuth, async (req, res) => {
  try {
    const [categories] = await pool.promise().query(
      'SELECT * FROM categories WHERE user_id = ? ORDER BY name',
      [req.session.userId]
    );
    
    if (categories.length === 0) {
      req.session.error = 'יש ליצור קטגוריה לפחות לפני יצירת משימה';
      return res.redirect('/categories');
    }
    
    res.render('tasks/create', {
      categories,
      error: req.session.error
    });
    
    delete req.session.error;
    
  } catch (error) {
    console.error('שגיאה בטעינת קטגוריות:', error);
    req.session.error = 'שגיאה בטעינת הקטגוריות';
    res.redirect('/tasks');
  }
});

// יצירת משימה חדשה
router.post('/create', requireAuth, async (req, res) => {
  try {
    const { description, due_date, category_id } = req.body;
    
    // בדיקות תקינות
    if (!description || description.trim().length === 0) {
      req.session.error = 'תיאור המשימה נדרש';
      return res.redirect('/tasks/create');
    }
    
    if (description.length > 200) {
      req.session.error = 'תיאור המשימה חייב להיות עד 200 תווים';
      return res.redirect('/tasks/create');
    }
    
    if (!due_date) {
      req.session.error = 'תאריך יעד נדרש';
      return res.redirect('/tasks/create');
    }
    
    if (!category_id) {
      req.session.error = 'יש לבחור קטגוריה';
      return res.redirect('/tasks/create');
    }
    
    // בדיקה שהתאריך לא בעבר
    const dueDate = new Date(due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dueDate < today) {
      req.session.error = 'תאריך היעד לא יכול להיות בעבר';
      return res.redirect('/tasks/create');
    }
    
    // בדיקה שהקטגוריה שייכת למשתמש
    const [category] = await pool.promise().query(
      'SELECT id FROM categories WHERE id = ? AND user_id = ?',
      [category_id, req.session.userId]
    );
    
    if (category.length === 0) {
      req.session.error = 'הקטגוריה לא נמצאה';
      return res.redirect('/tasks/create');
    }
    
    // יצירת המשימה
    await pool.promise().query(
      'INSERT INTO tasks (user_id, category_id, description, due_date, is_done) VALUES (?, ?, ?, ?, 0)',
      [req.session.userId, category_id, description.trim(), due_date]
    );
    
    req.session.success = 'המשימה נוצרה בהצלחה!';
    res.redirect('/tasks');
    
  } catch (error) {
    console.error('שגיאה ביצירת משימה:', error);
    req.session.error = 'שגיאה ביצירת המשימה';
    res.redirect('/tasks/create');
  }
});

// עמוד עריכת משימה
router.get('/edit/:id', requireAuth, async (req, res) => {
  try {
    const taskId = req.params.id;
    const promisePool = pool.promise();
    
    const [tasks] = await promisePool.query(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, req.session.userId]
    );
    
    if (tasks.length === 0) {
      req.session.error = 'המשימה לא נמצאה';
      return res.redirect('/tasks');
    }
    
    const [categories] = await promisePool.query(
      'SELECT * FROM categories WHERE user_id = ? ORDER BY name',
      [req.session.userId]
    );
    
    res.render('tasks/edit', {
      task: tasks[0],
      categories,
      error: req.session.error
    });
    
    delete req.session.error;
    
  } catch (error) {
    console.error('שגיאה בטעינת משימה:', error);
    req.session.error = 'שגיאה בטעינת המשימה';
    res.redirect('/tasks');
  }
});

// עדכון משימה
router.post('/edit/:id', requireAuth, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { description, due_date, category_id } = req.body;
    
    // בדיקות תקינות
    if (!description || description.trim().length === 0) {
      req.session.error = 'תיאור המשימה נדרש';
      return res.redirect(`/tasks/edit/${taskId}`);
    }
    
    if (description.length > 200) {
      req.session.error = 'תיאור המשימה חייב להיות עד 200 תווים';
      return res.redirect(`/tasks/edit/${taskId}`);
    }
    
    if (!due_date) {
      req.session.error = 'תאריך יעד נדרש';
      return res.redirect(`/tasks/edit/${taskId}`);
    }
    
    if (!category_id) {
      req.session.error = 'יש לבחור קטגוריה';
      return res.redirect(`/tasks/edit/${taskId}`);
    }
    
    // בדיקה שהתאריך לא בעבר
    const dueDate = new Date(due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dueDate < today) {
      req.session.error = 'תאריך היעד לא יכול להיות בעבר';
      return res.redirect(`/tasks/edit/${taskId}`);
    }
    
    const promisePool = pool.promise();
    
    // בדיקה שהמשימה שייכת למשתמש
    const [existing] = await promisePool.query(
      'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, req.session.userId]
    );
    
    if (existing.length === 0) {
      req.session.error = 'המשימה לא נמצאה';
      return res.redirect('/tasks');
    }
    
    // בדיקה שהקטגוריה שייכת למשתמש
    const [category] = await promisePool.query(
      'SELECT id FROM categories WHERE id = ? AND user_id = ?',
      [category_id, req.session.userId]
    );
    
    if (category.length === 0) {
      req.session.error = 'הקטגוריה לא נמצאה';
      return res.redirect(`/tasks/edit/${taskId}`);
    }
    
    // עדכון המשימה
    await promisePool.query(
      'UPDATE tasks SET description = ?, due_date = ?, category_id = ? WHERE id = ? AND user_id = ?',
      [description.trim(), due_date, category_id, taskId, req.session.userId]
    );
    
    req.session.success = 'המשימה עודכנה בהצלחה!';
    res.redirect('/tasks');
    
  } catch (error) {
    console.error('שגיאה בעדכון משימה:', error);
    req.session.error = 'שגיאה בעדכון המשימה';
    res.redirect('/tasks');
  }
});

// סימון משימה כבוצעת/לא בוצעת
router.post('/toggle/:id', requireAuth, async (req, res) => {
  try {
    const taskId = req.params.id;
    const promisePool = pool.promise();
    
    // קבלת הסטטוס הנוכחי
    const [tasks] = await promisePool.query(
      'SELECT is_done FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, req.session.userId]
    );
    
    if (tasks.length === 0) {
      req.session.error = 'המשימה לא נמצאה';
      return res.redirect('/tasks');
    }
    
    const newStatus = tasks[0].is_done ? 0 : 1;
    
    // עדכון הסטטוס
    await promisePool.query(
      'UPDATE tasks SET is_done = ? WHERE id = ? AND user_id = ?',
      [newStatus, taskId, req.session.userId]
    );
    
    const statusText = newStatus ? 'בוצעה' : 'לא בוצעה';
    req.session.success = `המשימה סומנה כ${statusText}!`;
    
    res.redirect('/tasks');
    
  } catch (error) {
    console.error('שגיאה בסימון משימה:', error);
    req.session.error = 'שגיאה בסימון המשימה';
    res.redirect('/tasks');
  }
});

// מחיקת משימה
router.post('/delete/:id', requireAuth, async (req, res) => {
  try {
    const taskId = req.params.id;
    const promisePool = pool.promise();
    
    const [result] = await promisePool.query(
      'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, req.session.userId]
    );
    
    if (result.affectedRows === 0) {
      req.session.error = 'המשימה לא נמצאה';
    } else {
      req.session.success = 'המשימה נמחקה בהצלחה!';
    }
    
    res.redirect('/tasks');
    
  } catch (error) {
    console.error('שגיאה במחיקת משימה:', error);
    req.session.error = 'שגיאה במחיקת המשימה';
    res.redirect('/tasks');
  }
});

module.exports = router; 