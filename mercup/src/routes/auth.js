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
  res.json({ id: req.session.userId, name: req.session.userName, role: req.session.userRole });
});

module.exports = router;
