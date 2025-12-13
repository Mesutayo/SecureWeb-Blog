const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'blog.db');

let db;

const initDatabase = () => {
  db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
    } else {
      console.log('Connected to SQLite database');
      createTables();
      createDefaultUsers();
    }
  });
};

const createTables = () => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    }
  });

  // Posts table
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating posts table:', err.message);
    }
  });
};

const createDefaultUsers = () => {
  // Check if users already exist
  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (err) {
      console.error('Error checking users:', err.message);
      return;
    }

    if (row.count === 0) {
      // Create default admin user
      const adminPassword = bcrypt.hashSync('Admin@123!Secure', 10);
      db.run(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        ['admin', 'admin@blog.com', adminPassword, 'admin'],
        (err) => {
          if (err) {
            console.error('Error creating admin user:', err.message);
          } else {
            console.log('Default admin user created: admin / admin123');
          }
        }
      );
      db.run(`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token TEXT UNIQUE NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating refresh_tokens table:', err.message);
        }
      });
      // Create default regular user
      const userPassword = bcrypt.hashSync('User@123!Secure', 10);
      db.run(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        ['user', 'user@blog.com', userPassword, 'user'],
        (err) => {
          if (err) {
            console.error('Error creating user:', err.message);
          } else {
            console.log('Default regular user created: user / user123');
          }
        }
      );
    }
  });
};

const getDb = () => {
  return db;
};

module.exports = { initDatabase, getDb };

