const jwt = require('jsonwebtoken');
const db = require('../db');

function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Требуется авторизация'
    });
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = db
      .prepare('SELECT id, username, email, role, createdAt FROM users WHERE id = ?')
      .get(payload.userId);

    if (!user) {
      return res.status(401).json({
        message: 'Пользователь не найден'
      });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({
      message: 'Недействительный или истёкший токен'
    });
  }
}

module.exports = auth;
