const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const db = new Database('mercup.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'client',
    phone TEXT,
    address TEXT
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

  CREATE TABLE IF NOT EXISTS cart (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    UNIQUE(user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
`);

// Migrações seguras
try { db.exec('ALTER TABLE users ADD COLUMN phone TEXT'); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN address TEXT'); } catch {}

// Recria orders sem slot_id se necessário
const ordersCols = db.prepare('PRAGMA table_info(orders)').all().map(c => c.name);
if (!ordersCols.includes('delivery_type')) {
  // Tabela não existe ou está desatualizada — recria do zero
  db.exec(`DROP TABLE IF EXISTS orders;`);
}
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    delivery_type TEXT NOT NULL DEFAULT 'pickup',
    items TEXT NOT NULL,
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_note TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);
// Se ainda tem slot_id, migra
const colsNow = db.prepare('PRAGMA table_info(orders)').all().map(c => c.name);
if (colsNow.includes('slot_id')) {
  db.exec(`
    CREATE TABLE orders_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      delivery_type TEXT NOT NULL DEFAULT 'pickup',
      items TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      admin_note TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    INSERT INTO orders_new (id, user_id, delivery_type, items, total, status, admin_note, created_at)
      SELECT id, user_id, COALESCE(delivery_type,'pickup'), items, total, COALESCE(status,'pending'), admin_note, created_at FROM orders;
    DROP TABLE orders;
    ALTER TABLE orders_new RENAME TO orders;
  `);
}

// Admin padrão
const admin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
if (!admin) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Admin', 'admin@mercup.com', hash, 'admin');
  console.log('Admin criado: admin@mercup.com / admin123');
}

module.exports = db;
