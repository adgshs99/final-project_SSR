const mysql  = require('mysql2');
const params = require('../gen_params');

const pool = mysql.createPool({
  host:            params.HOST,
  user:            params.USER,
  password:        params.PASSWORD,
  database:        params.DATABASE,
  port:            params.PORT || 3306,
  waitForConnections: true,
  connectionLimit:    10,
  maxIdle:            10,
  idleTimeout:        60000,
  queueLimit:         0,
  enableKeepAlive:    true,
  keepAliveInitialDelay: 0
});

module.exports = { pool };
