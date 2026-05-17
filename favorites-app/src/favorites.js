const { Router } = require('express');
const db = require('./db');

const router = Router();

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Não autenticado' });
  next();
}

router.get('/', requireAuth, (req, res) => {
  const favorites = db.prepare('SELECT * FROM favorites WHERE user_id = ?').all(req.session.userId);
  res.json(favorites);
});

router.post('/', requireAuth, (req, res) => {
  const { item_id, title, description, image } = req.body;
  if (!item_id || !title) return res.status(400).json({ error: 'item_id e title são obrigatórios' });

  try {
    db.prepare(
      'INSERT INTO favorites (user_id, item_id, title, description, image) VALUES (?, ?, ?, ?, ?)'
    ).run(req.session.userId, item_id, title, description, image);
    res.status(201).json({ ok: true });
  } catch {
    res.status(409).json({ error: 'Item já está nos favoritos' });
  }
});

router.delete('/:item_id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND item_id = ?')
    .run(req.session.userId, req.params.item_id);
  res.json({ ok: true });
});

module.exports = router;
