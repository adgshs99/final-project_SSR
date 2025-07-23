const port = 7777;
const express = require('express');
const path = require("path");
const cookieParser = require('cookie-parser');
global.jwt = require('jsonwebtoken');

const { pool } = require('./database/database');
const user_Mid = require("./middleware/user_Mid");
const auth_R = require('./Routers/auth');
const categories_R = require('./Routers/categories');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.set("view engine", "ejs");
app.set('views', path.join(__dirname, "./views"));

app.use('/', auth_R);
app.use('/categories', user_Mid.isLogged, categories_R);

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.listen(port, () => {
    console.log(`Now listening on port http://localhost:${port}`);
});