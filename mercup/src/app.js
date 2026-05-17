const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(session({
  secret: 'mercup-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 },
}));

app.use('/auth', require('./routes/auth'));
app.use('/api', require('./routes/api'));

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`MercUp rodando em http://localhost:${PORT}`));
