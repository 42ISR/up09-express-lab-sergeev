require('dotenv').config();

const bcrypt = require('bcryptjs');
const db = require('./db');

async function seed() {
  const passwordHash = await bcrypt.hash('qwerty123', 10);

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, email, password, role)
    VALUES (?, ?, ?, ?)
  `);

  insertUser.run('admin', 'admin@example.com', passwordHash, 'admin');
  insertUser.run('user', 'user@example.com', passwordHash, 'user');

  const admin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  const user = db.prepare('SELECT id FROM users WHERE username = ?').get('user');

  const booksCount = db.prepare('SELECT COUNT(*) AS count FROM books').get().count;

  if (booksCount === 0) {
    const insertBook = db.prepare(`
      INSERT INTO books
        (title, author, year, genre, description, createdBy)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const books = [
      ['1984', 'George Orwell', 1949, 'Dystopian', 'Антиутопия о тоталитарном обществе и контроле над человеком.', user.id],
      ['The Hobbit', 'J.R.R. Tolkien', 1937, 'Fantasy', 'Приключение Бильбо Бэггинса в Средиземье.', admin.id],
      ['Pride and Prejudice', 'Jane Austen', 1813, 'Romance', 'Классический роман о любви, характерах и социальных предрассудках.', user.id],
      ['The Martian', 'Andy Weir', 2011, 'Science Fiction', 'Астронавт пытается выжить в одиночестве на Марсе.', admin.id],
      ['The Little Prince', 'Antoine de Saint-Exupéry', 1943, 'Fable', 'Философская сказка о дружбе, любви и человеческих ценностях.', user.id]
    ];

    for (const book of books) {
      insertBook.run(...book);
    }
  }

  const reviewsCount = db.prepare('SELECT COUNT(*) AS count FROM reviews').get().count;

  if (reviewsCount === 0) {
    const bookIds = db.prepare('SELECT id FROM books ORDER BY id LIMIT 5').all();

    const insertReview = db.prepare(`
      INSERT INTO reviews (bookId, userId, rating, comment)
      VALUES (?, ?, ?, ?)
    `);

    const reviews = [
      [bookIds[0].id, user.id, 5, 'Очень сильная и актуальная книга.'],
      [bookIds[1].id, admin.id, 5, 'Отличное приключение и прекрасный мир.'],
      [bookIds[2].id, user.id, 4, 'Классика, которую приятно перечитывать.'],
      [bookIds[3].id, admin.id, 5, 'Захватывающая история с хорошей научной основой.'],
      [bookIds[4].id, user.id, 5, 'Простая история с глубоким смыслом.']
    ];

    for (const review of reviews) {
      insertReview.run(...review);
    }
  }

  console.log('Seed completed.');
  console.log('Admin: admin / qwerty123');
  console.log('User:  user / qwerty123');
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
