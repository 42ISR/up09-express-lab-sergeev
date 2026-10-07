const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/role');

const router = express.Router();

router.use(auth, checkRole('admin'));

router.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT id, username, email, role, createdAt
    FROM users
    ORDER BY id
  `).all();

  res.json({ users });
});

router.delete('/users/:id', (req, res) => {
  const user = db
    .prepare('SELECT id, username, email, role FROM users WHERE id = ?')
    .get(req.params.id);

  if (!user) {
    return res.status(404).json({
      message: 'Пользователь не найден'
    });
  }

  if (user.id === req.user.id) {
    return res.status(400).json({
      message: 'Нельзя удалить самого себя'
    });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);

  res.json({
    message: 'Пользователь удалён'
  });
});

module.exports = router;
