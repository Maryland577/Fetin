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

// ── PRODUTOS ──────────────────────────────────────
router.get('/products', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM products ORDER BY name').all());
});

router.get('/products/:id', requireAuth, (req, res) => {
  const p = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Produto não encontrado' });
  res.json(p);
});

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

// ── PROMOÇÕES ─────────────────────────────────────
router.get('/promotions', requireAuth, (req, res) => {
  res.json(db.prepare(`
    SELECT pr.*, p.name as product_name, p.price as product_price
    FROM promotions pr
    LEFT JOIN products p ON pr.product_id = p.id
    WHERE pr.active = 1
    ORDER BY pr.id DESC
  `).all());
});

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

// ── PEDIDOS (ADMIN) ───────────────────────────────
router.get('/orders', requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT o.id, o.items, o.total, o.status, o.delivery_type, o.admin_note, o.created_at,
           u.name as user_name, u.phone as user_phone, u.address as user_address
    FROM orders o
    JOIN users u ON u.id = o.user_id
    ORDER BY o.id DESC
  `).all();
  res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items) })));
});

router.put('/orders/:id/status', requireAdmin, (req, res) => {
  const { status, admin_note } = req.body;
  if (!['approved', 'ready', 'done', 'rejected'].includes(status))
    return res.status(400).json({ error: 'Status inválido' });
  // entrega: apenas cliente pode marcar como done
  const order = db.prepare('SELECT delivery_type FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  if (order.delivery_type === 'delivery' && status === 'done')
    return res.status(403).json({ error: 'Somente o cliente pode confirmar o recebimento' });
  db.prepare('UPDATE orders SET status=?, admin_note=? WHERE id=?')
    .run(status, admin_note || null, req.params.id);
  res.json({ ok: true });
});

// ── PEDIDOS (CLIENTE) ─────────────────────────────
router.get('/my-orders', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT id, items, total, status, delivery_type, admin_note, created_at
    FROM orders WHERE user_id = ? ORDER BY id DESC
  `).all(req.session.userId);
  res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items) })));
});

// Cliente confirma recebimento (apenas entrega)
router.put('/my-orders/:id/confirm', requireAuth, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.session.userId);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  if (order.delivery_type !== 'delivery') return res.status(400).json({ error: 'Apenas pedidos de entrega podem ser confirmados pelo cliente' });
  if (order.status !== 'ready') return res.status(400).json({ error: 'Pedido ainda não está a caminho' });
  db.prepare('UPDATE orders SET status=? WHERE id=?').run('done', req.params.id);
  res.json({ ok: true });
});

// ── CARRINHO ──────────────────────────────────────
router.get('/cart', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT c.product_id as id, c.qty, p.name, p.price, p.image, p.stock, p.category, p.description
    FROM cart c
    JOIN products p ON p.id = c.product_id
    WHERE c.user_id = ?
  `).all(req.session.userId);
  res.json(rows);
});

router.post('/cart', requireAuth, (req, res) => {
  const { product_id, qty } = req.body;
  if (!product_id || qty == null) return res.status(400).json({ error: 'Dados inválidos' });
  if (qty <= 0) {
    db.prepare('DELETE FROM cart WHERE user_id = ? AND product_id = ?').run(req.session.userId, product_id);
  } else {
    db.prepare('INSERT INTO cart (user_id, product_id, qty) VALUES (?,?,?) ON CONFLICT(user_id, product_id) DO UPDATE SET qty = ?')
      .run(req.session.userId, product_id, qty, qty);
  }
  res.json({ ok: true });
});

router.delete('/cart', requireAuth, (req, res) => {
  db.prepare('DELETE FROM cart WHERE user_id = ?').run(req.session.userId);
  res.json({ ok: true });
});

// ── CHECKOUT ──────────────────────────────────────
router.post('/checkout', requireAuth, (req, res) => {
  if (req.session.userRole === 'admin')
    return res.status(403).json({ error: 'Administradores não podem realizar compras' });

  const { items, delivery_type } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'Carrinho vazio' });
  if (!['delivery', 'pickup'].includes(delivery_type))
    return res.status(400).json({ error: 'Tipo de entrega inválido' });

  const userId = req.session.userId;

  const doCheckout = db.transaction(() => {
    for (const item of items) {
      const product = db.prepare('SELECT name, stock FROM products WHERE id = ?').get(item.id);
      if (!product) throw new Error('Produto não encontrado');
      if (product.stock < item.qty) throw new Error(`Estoque insuficiente para "${product.name}"`);
    }
    for (const item of items) {
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.qty, item.id);
    }
    const total = items.reduce((s, i) => {
      const p = db.prepare('SELECT price FROM products WHERE id = ?').get(i.id);
      return s + (p ? p.price * i.qty : 0);
    }, 0);
    db.prepare('INSERT INTO orders (user_id, delivery_type, items, total) VALUES (?,?,?,?)')
      .run(userId, delivery_type, JSON.stringify(items), total);
    db.prepare('DELETE FROM cart WHERE user_id = ?').run(userId);
  });

  try {
    doCheckout();
    res.json({ ok: true });
  } catch (e) {
    res.status(409).json({ error: e.message });
  }
});

module.exports = router;
