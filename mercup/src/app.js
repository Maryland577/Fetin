const express = require('express');
const session = require('express-session');
const SqliteStore = require('better-sqlite3-session-store')(session);
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const sessionDb = new Database('sessions.db');

app.use(express.json());
app.use(session({
  store: new SqliteStore({ client: sessionDb, expired: { clear: true, intervalMs: 900000 } }),
  secret: 'mercup-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 },
}));

app.use('/auth', require('./routes/auth'));
app.use('/api', require('./routes/api'));

app.use(express.static(path.join(__dirname, '../public')));

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`MercUp rodando em http://localhost:${PORT}`));
