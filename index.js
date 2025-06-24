const express = require('express');
const { pool } = require('./database/database'); 
const app     = express();

app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

(async () => {
  try {
    const promisePool = pool.promise();
    const [r] = await promisePool.query('SELECT 1');
    console.log('DB OK');
  } catch (e) {
    console.error('DB ERROR', e.message);
  }
})();

app.get('/', (req, res) => {
  res.send('hello');
});

const PORT = 7777;
app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
