const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/books/:id/reviews', auth, (req, res) => {
  const { rating, comment } = req.body;

  const book = db
    .prepare('SELECT id FROM books WHERE id = ?')
    .get(req.params.id);

  if (!book) {
    return res.status(404).json({
      message: 'Книга не найдена'
    });
  }

  if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
    return res.status(400).json({
      message: 'rating должен быть целым числом от 1 до 5'
    });
  }

  if (!comment || !comment.trim()) {
    return res.status(400).json({
      message: 'comment обязателен'
    });
  }

  const result = db.prepare(`
    INSERT INTO reviews (bookId, userId, rating, comment)
    VALUES (?, ?, ?, ?)
  `).run(
    req.params.id,
    req.user.id,
    Number(rating),
    comment.trim()
  );

  const review = db.prepare(`
    SELECT
      reviews.id,
      reviews.bookId,
      reviews.userId,
      users.username,
      reviews.rating,
      reviews.comment,
      reviews.createdAt
    FROM reviews
    JOIN users ON users.id = reviews.userId
    WHERE reviews.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({
    message: 'Отзыв добавлен',
    review
  });
});

router.get('/books/:id/reviews', (req, res) => {
  const book = db
    .prepare('SELECT id FROM books WHERE id = ?')
    .get(req.params.id);

  if (!book) {
    return res.status(404).json({
      message: 'Книга не найдена'
    });
  }

  const reviews = db.prepare(`
    SELECT
      reviews.id,
      reviews.bookId,
      reviews.userId,
      users.username,
      reviews.rating,
      reviews.comment,
      reviews.createdAt
    FROM reviews
    JOIN users ON users.id = reviews.userId
    WHERE reviews.bookId = ?
    ORDER BY reviews.id
  `).all(req.params.id);

  res.json({ reviews });
});

router.delete('/reviews/:id', auth, (req, res) => {
  const review = db
    .prepare('SELECT * FROM reviews WHERE id = ?')
    .get(req.params.id);

  if (!review) {
    return res.status(404).json({
      message: 'Отзыв не найден'
    });
  }

  if (req.user.role !== 'admin' && review.userId !== req.user.id) {
    return res.status(403).json({
      message: 'Удалять отзыв может только его автор или администратор'
    });
  }

  db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);

  res.json({
    message: 'Отзыв удалён'
  });
});

module.exports = router;
