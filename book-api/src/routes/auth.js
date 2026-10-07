const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      message: 'username, email и password обязательны'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: 'Пароль должен содержать минимум 6 символов'
    });
  }

  const existing = db
    .prepare('SELECT id FROM users WHERE username = ? OR email = ?')
    .get(username, email);

  if (existing) {
    return res.status(409).json({
      message: 'Пользователь с таким username или email уже существует'
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = db
    .prepare(`
      INSERT INTO users (username, email, password, role)
      VALUES (?, ?, ?, 'user')
    `)
    .run(username, email, passwordHash);

  const user = db
    .prepare('SELECT id, username, email, role, createdAt FROM users WHERE id = ?')
    .get(result.lastInsertRowid);

  res.status(201).json({
    message: 'Пользователь зарегистрирован',
    user
  });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      message: 'username и password обязательны'
    });
  }

  const user = db
    .prepare('SELECT * FROM users WHERE username = ?')
    .get(username);

  if (!user) {
    return res.status(401).json({
      message: 'Неверные учётные данные'
    });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(401).json({
      message: 'Неверные учётные данные'
    });
  }

  const token = createToken(user);

  res.json({
    message: 'Успешный вход',
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    }
  });
});

router.get('/profile', auth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
