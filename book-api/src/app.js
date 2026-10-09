require('dotenv').config();

const express = require('express');
const db = require('./db');

const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured. Create .env from .env.example.');
}

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Book API is running',
    endpoints: {
      auth: '/api/auth',
      books: '/api/books',
      reviews: '/api/books/:id/reviews',
      admin: '/api/admin'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api', reviewRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: 'Endpoint not found'
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    message: 'Внутренняя ошибка сервера'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Book API listening on http://localhost:${PORT}`);
});
