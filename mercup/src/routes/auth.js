const { Router } = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');

const router = Router();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Preencha todos os campos' });

  try {
    const hash = await bcrypt.hash(password, 10);
    db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(name, email, hash);
    res.json({ ok: true });
  } catch {
    res.status(409).json({ error: 'Email já cadastrado' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: 'Email ou senha inválidos' });

  req.session.userId = user.id;
  req.session.userName = user.name;
  req.session.userRole = user.role;
  res.json({ ok: true, role: user.role });
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Não autenticado' });
  const user = db.prepare('SELECT id, name, email, role, phone, address FROM users WHERE id = ?').get(req.session.userId);
  res.json(user);
});

router.put('/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Não autenticado' });
  const { name, email, phone, address } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
  if (!email) return res.status(400).json({ error: 'E-mail é obrigatório' });

  const conflict = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.session.userId);
  if (conflict) return res.status(409).json({ error: 'E-mail já está em uso por outra conta' });

  db.prepare('UPDATE users SET name=?, email=?, phone=?, address=? WHERE id=?')
    .run(name, email, phone || null, address || null, req.session.userId);
  req.session.userName = name;
  res.json({ ok: true });
});

module.exports = router;
