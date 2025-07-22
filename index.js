const express = require('express');
const { pool } = require('./database/database'); 
const app = express();
const session = require('express-session');
const authRoutes = require('./Routers/auth');

app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: 'your-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use('/', authRoutes);

(async () => {
  try {
    const promisePool = pool.promise();
    const [r] = await promisePool.query('SELECT 1');
    console.log('DB OK');
  } catch (e) {
    console.error('DB ERROR', e.message);
  }
})();

const PORT = 7777;
app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});