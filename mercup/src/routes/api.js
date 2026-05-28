const { Router } = require('express');
const db = require('../db');

const router = Router();

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Não autenticado' });
  next();
}

function requireAdmin(req, res, next) {
  if (req.session.userRole !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
  next();
}

// Produtos — leitura pública (cliente)
router.get('/products', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM products ORDER BY name').all());
});

router.get('/products/:id', requireAuth, (req, res) => {
  const p = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Produto não encontrado' });
  res.json(p);
});

// Produtos — escrita (admin)
router.post('/products', requireAdmin, (req, res) => {
  const { name, description, price, stock, category, image } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Nome e preço são obrigatórios' });
  const result = db.prepare(
    'INSERT INTO products (name, description, price, stock, category, image) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, description, price, stock || 0, category, image);
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/products/:id', requireAdmin, (req, res) => {
  const { name, description, price, stock, category, image } = req.body;
  db.prepare(
    'UPDATE products SET name=?, description=?, price=?, stock=?, category=?, image=? WHERE id=?'
  ).run(name, description, price, stock, category, image, req.params.id);
  res.json({ ok: true });
});

router.delete('/products/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Promoções — leitura pública (cliente)
router.get('/promotions', requireAuth, (req, res) => {
  res.json(db.prepare(`
    SELECT pr.*, p.name as product_name, p.price as product_price
    FROM promotions pr
    LEFT JOIN products p ON pr.product_id = p.id
    WHERE pr.active = 1
    ORDER BY pr.id DESC
  `).all());
});

// Promoções — escrita (admin)
router.get('/promotions/all', requireAdmin, (req, res) => {
  res.json(db.prepare(`
    SELECT pr.*, p.name as product_name
    FROM promotions pr
    LEFT JOIN products p ON pr.product_id = p.id
    ORDER BY pr.id DESC
  `).all());
});

router.post('/promotions', requireAdmin, (req, res) => {
  const { title, description, discount, product_id, image, expires_at } = req.body;
  if (!title || !discount) return res.status(400).json({ error: 'Título e desconto são obrigatórios' });
  const result = db.prepare(
    'INSERT INTO promotions (title, description, discount, product_id, image, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(title, description, discount, product_id || null, image, expires_at);
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/promotions/:id', requireAdmin, (req, res) => {
  const { title, description, discount, product_id, image, expires_at, active } = req.body;
  db.prepare(
    'UPDATE promotions SET title=?, description=?, discount=?, product_id=?, image=?, expires_at=?, active=? WHERE id=?'
  ).run(title, description, discount, product_id || null, image, expires_at, active, req.params.id);
  res.json({ ok: true });
});

router.delete('/promotions/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM promotions WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Checkout — desconta estoque de cada item do carrinho
router.post('/checkout', requireAuth, (req, res) => {
  const { items } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'Carrinho vazio' });

  const checkStock = db.transaction(() => {
    for (const item of items) {
      const product = db.prepare('SELECT name, stock FROM products WHERE id = ?').get(item.id);
      if (!product) throw new Error(`Produto não encontrado`);
      if (product.stock < item.qty)
        throw new Error(`Estoque insuficiente para "${product.name}"`);
    }
    for (const item of items) {
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.qty, item.id);
    }
  });

  try {
    checkStock();
    res.json({ ok: true });
  } catch (e) {
    res.status(409).json({ error: e.message });
  }
});

module.exports = router;
