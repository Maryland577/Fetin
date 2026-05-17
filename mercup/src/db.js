const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const db = new Database('mercup.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'client'
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    category TEXT,
    image TEXT
  );

  CREATE TABLE IF NOT EXISTS promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    discount INTEGER NOT NULL,
    product_id INTEGER,
    image TEXT,
    expires_at TEXT,
    active INTEGER DEFAULT 1,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
`);

// Cria admin padrão se não existir
const admin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
if (!admin) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Admin', 'admin@mercup.com', hash, 'admin');
  console.log('Admin criado: admin@mercup.com / admin123');
}

module.exports = db;
