const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { genre, author } = req.query;

  let query = `
    SELECT
      books.id,
      books.title,
      books.author,
      books.year,
      books.genre,
      books.description,
      books.createdBy,
      books.createdAt,
      users.username AS addedBy
    FROM books
    JOIN users ON users.id = books.createdBy
  `;

  const conditions = [];
  const params = [];

  if (genre) {
    conditions.push('LOWER(books.genre) = LOWER(?)');
    params.push(genre);
  }

  if (author) {
    conditions.push('LOWER(books.author) LIKE LOWER(?)');
    params.push(`%${author}%`);
  }

  if (conditions.length) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ' ORDER BY books.id';

  const books = db.prepare(query).all(...params);

  res.json({ books });
});

router.get('/:id', (req, res) => {
  const book = db.prepare(`
    SELECT
      books.id,
      books.title,
      books.author,
      books.year,
      books.genre,
      books.description,
      books.createdBy,
      books.createdAt,
      users.username AS addedBy
    FROM books
    JOIN users ON users.id = books.createdBy
    WHERE books.id = ?
  `).get(req.params.id);

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

  res.json({
    book,
    reviews
  });
});

router.post('/', auth, (req, res) => {
  const { title, author, year, genre, description } = req.body;

  if (!title || !author || !year || !genre || !description) {
    return res.status(400).json({
      message: 'title, author, year, genre и description обязательны'
    });
  }

  if (!Number.isInteger(Number(year)) || Number(year) < 0) {
    return res.status(400).json({
      message: 'year должен быть целым положительным числом'
    });
  }

  const result = db.prepare(`
    INSERT INTO books
      (title, author, year, genre, description, createdBy)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    title,
    author,
    Number(year),
    genre,
    description,
    req.user.id
  );

  const book = db.prepare(`
    SELECT
      books.*,
      users.username AS addedBy
    FROM books
    JOIN users ON users.id = books.createdBy
    WHERE books.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({
    message: 'Книга добавлена',
    book
  });
});

router.put('/:id', auth, (req, res) => {
  const book = db
    .prepare('SELECT * FROM books WHERE id = ?')
    .get(req.params.id);

  if (!book) {
    return res.status(404).json({
      message: 'Книга не найдена'
    });
  }

  if (req.user.role !== 'admin' && book.createdBy !== req.user.id) {
    return res.status(403).json({
      message: 'Изменять книгу может только её автор или администратор'
    });
  }

  const { title, author, year, genre, description } = req.body;

  if (!title || !author || !year || !genre || !description) {
    return res.status(400).json({
      message: 'title, author, year, genre и description обязательны'
    });
  }

  db.prepare(`
    UPDATE books
    SET title = ?, author = ?, year = ?, genre = ?, description = ?
    WHERE id = ?
  `).run(
    title,
    author,
    Number(year),
    genre,
    description,
    req.params.id
  );

  const updated = db
    .prepare('SELECT * FROM books WHERE id = ?')
    .get(req.params.id);

  res.json({
    message: 'Книга обновлена',
    book: updated
  });
});

router.delete('/:id', auth, (req, res) => {
  const book = db
    .prepare('SELECT * FROM books WHERE id = ?')
    .get(req.params.id);

  if (!book) {
    return res.status(404).json({
      message: 'Книга не найдена'
    });
  }

  if (req.user.role !== 'admin' && book.createdBy !== req.user.id) {
    return res.status(403).json({
      message: 'Удалять книгу может только её автор или администратор'
    });
  }

  db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);

  res.json({
    message: 'Книга удалена'
  });
});

module.exports = router;
