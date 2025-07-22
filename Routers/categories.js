const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { pool } = require('../database/database');

// הצגת רשימת הקטגוריות
router.get('/', requireAuth, async (req, res) => {
  try {
    const promisePool = pool.promise();
    const [categories] = await promisePool.query(
      'SELECT * FROM categories WHERE user_id = ? ORDER BY name',
      [req.session.userId]
    );
    
    res.render('categories/index', {
      categories,
      error: req.session.error,
      success: req.session.success
    });
    
    delete req.session.error;
    delete req.session.success;
    
  } catch (error) {
    console.error('שגיאה בטעינת קטגוריות:', error);
    req.session.error = 'שגיאה בטעינת הקטגוריות';
    res.redirect('/dashboard');
  }
});

// עמוד יצירת קטגוריה חדשה
router.get('/create', requireAuth, (req, res) => {
  res.render('categories/create', {
    error: req.session.error
  });
  delete req.session.error;
});

// יצירת קטגוריה חדשה
router.post('/create', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    
    // בדיקות תקינות
    if (!name || name.trim().length === 0) {
      req.session.error = 'שם הקטגוריה נדרש';
      return res.redirect('/categories/create');
    }
    
    if (name.length > 100) {
      req.session.error = 'שם הקטגוריה חייב להיות עד 100 תווים';
      return res.redirect('/categories/create');
    }
    
    const promisePool = pool.promise();
    
    // בדיקה אם הקטגוריה כבר קיימת למשתמש זה
    const [existing] = await promisePool.query(
      'SELECT id FROM categories WHERE user_id = ? AND name = ?',
      [req.session.userId, name.trim()]
    );
    
    if (existing.length > 0) {
      req.session.error = 'קטגוריה עם שם זה כבר קיימת';
      return res.redirect('/categories/create');
    }
    
    // יצירת הקטגוריה
    await promisePool.query(
      'INSERT INTO categories (user_id, name) VALUES (?, ?)',
      [req.session.userId, name.trim()]
    );
    
    req.session.success = 'הקטגוריה נוצרה בהצלחה!';
    res.redirect('/categories');
    
  } catch (error) {
    console.error('שגיאה ביצירת קטגוריה:', error);
    req.session.error = 'שגיאה ביצירת הקטגוריה';
    res.redirect('/categories/create');
  }
});

// עמוד עריכת קטגוריה
router.get('/edit/:id', requireAuth, async (req, res) => {
  try {
    const categoryId = req.params.id;
    const promisePool = pool.promise();
    
    const [categories] = await promisePool.query(
      'SELECT * FROM categories WHERE id = ? AND user_id = ?',
      [categoryId, req.session.userId]
    );
    
    if (categories.length === 0) {
      req.session.error = 'הקטגוריה לא נמצאה';
      return res.redirect('/categories');
    }
    
    res.render('categories/edit', {
      category: categories[0],
      error: req.session.error
    });
    
    delete req.session.error;
    
  } catch (error) {
    console.error('שגיאה בטעינת קטגוריה:', error);
    req.session.error = 'שגיאה בטעינת הקטגוריה';
    res.redirect('/categories');
  }
});

// עדכון קטגוריה
router.post('/edit/:id', requireAuth, async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { name } = req.body;
    
    // בדיקות תקינות
    if (!name || name.trim().length === 0) {
      req.session.error = 'שם הקטגוריה נדרש';
      return res.redirect(`/categories/edit/${categoryId}`);
    }
    
    if (name.length > 100) {
      req.session.error = 'שם הקטגוריה חייב להיות עד 100 תווים';
      return res.redirect(`/categories/edit/${categoryId}`);
    }
    
    const promisePool = pool.promise();
    
    // בדיקה אם הקטגוריה שייכת למשתמש
    const [existing] = await promisePool.query(
      'SELECT id FROM categories WHERE id = ? AND user_id = ?',
      [categoryId, req.session.userId]
    );
    
    if (existing.length === 0) {
      req.session.error = 'הקטגוריה לא נמצאה';
      return res.redirect('/categories');
    }
    
    // בדיקה אם שם הקטגוריה כבר קיים למשתמש זה (חוץ מהקטגוריה הנוכחית)
    const [duplicate] = await promisePool.query(
      'SELECT id FROM categories WHERE user_id = ? AND name = ? AND id != ?',
      [req.session.userId, name.trim(), categoryId]
    );
    
    if (duplicate.length > 0) {
      req.session.error = 'קטגוריה עם שם זה כבר קיימת';
      return res.redirect(`/categories/edit/${categoryId}`);
    }
    
    // עדכון הקטגוריה
    await promisePool.query(
      'UPDATE categories SET name = ? WHERE id = ? AND user_id = ?',
      [name.trim(), categoryId, req.session.userId]
    );
    
    req.session.success = 'הקטגוריה עודכנה בהצלחה!';
    res.redirect('/categories');
    
  } catch (error) {
    console.error('שגיאה בעדכון קטגוריה:', error);
    req.session.error = 'שגיאה בעדכון הקטגוריה';
    res.redirect('/categories');
  }
});

// מחיקת קטגוריה
router.post('/delete/:id', requireAuth, async (req, res) => {
  try {
    const categoryId = req.params.id;
    const promisePool = pool.promise();
    
    // בדיקה אם יש משימות בקטגוריה זו
    const [tasks] = await promisePool.query(
      'SELECT COUNT(*) as count FROM tasks WHERE category_id = ?',
      [categoryId]
    );
    
    if (tasks[0].count > 0) {
      req.session.error = 'לא ניתן למחוק קטגוריה שיש בה משימות';
      return res.redirect('/categories');
    }
    
    // מחיקת הקטגוריה
    const [result] = await promisePool.query(
      'DELETE FROM categories WHERE id = ? AND user_id = ?',
      [categoryId, req.session.userId]
    );
    
    if (result.affectedRows === 0) {
      req.session.error = 'הקטגוריה לא נמצאה';
    } else {
      req.session.success = 'הקטגוריה נמחקה בהצלחה!';
    }
    
    res.redirect('/categories');
    
  } catch (error) {
    console.error('שגיאה במחיקת קטגוריה:', error);
    req.session.error = 'שגיאה במחיקת הקטגוריה';
    res.redirect('/categories');
  }
});

module.exports = router; 