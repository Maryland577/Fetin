const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(session({
  secret: 'favorites-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 dia
}));

app.use('/auth', require('./auth'));
app.use('/favorites', require('./favorites'));

app.listen(3000, () => console.log('Rodando em http://localhost:3000'));
