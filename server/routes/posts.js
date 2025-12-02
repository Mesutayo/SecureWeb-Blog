const express = require('express');
const router = express.Router();
const { getDb } = require('../database/db');
const { authenticateToken } = require('./auth');

// Get all posts
router.get('/', (req, res) => {
  const db = getDb();
  
  db.all(
    `SELECT p.*, u.username as author_name 
     FROM posts p 
     JOIN users u ON p.author_id = u.id 
     ORDER BY p.created_at DESC`,
    [],
    (err, posts) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching posts' });
      }
      res.json({ posts });
    }
  );
});

// Get single post by ID
router.get('/:id', (req, res) => {
  const db = getDb();
  const postId = req.params.id;

  db.get(
    `SELECT p.*, u.username as author_name 
     FROM posts p 
     JOIN users u ON p.author_id = u.id 
     WHERE p.id = ?`,
    [postId],
    (err, post) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching post' });
      }
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      res.json({ post });
    }
  );
});

// Create new post (authenticated users only)
router.post('/', authenticateToken, (req, res) => {
  const db = getDb();
  const { title, content } = req.body;
  const authorId = req.user.id;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  db.run(
    'INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)',
    [title, content, authorId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error creating post' });
      }

      // Fetch the created post
      db.get(
        `SELECT p.*, u.username as author_name 
         FROM posts p 
         JOIN users u ON p.author_id = u.id 
         WHERE p.id = ?`,
        [this.lastID],
        (err, post) => {
          if (err) {
            return res.status(500).json({ error: 'Error fetching created post' });
          }
          res.status(201).json({ message: 'Post created successfully', post });
        }
      );
    }
  );
});

// Update post (author or admin only)
router.put('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const postId = req.params.id;
  const { title, content } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  // First check if post exists and get author
  db.get(
    'SELECT author_id FROM posts WHERE id = ?',
    [postId],
    (err, post) => {
      if (err) {
        return res.status(500).json({ error: 'Error checking post' });
      }
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Check if user is author or admin
      if (post.author_id !== userId && userRole !== 'admin') {
        return res.status(403).json({ error: 'You can only edit your own posts' });
      }

      // Update post
      db.run(
        'UPDATE posts SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [title, content, postId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Error updating post' });
          }

          // Fetch updated post
          db.get(
            `SELECT p.*, u.username as author_name 
             FROM posts p 
             JOIN users u ON p.author_id = u.id 
             WHERE p.id = ?`,
            [postId],
            (err, updatedPost) => {
              if (err) {
                return res.status(500).json({ error: 'Error fetching updated post' });
              }
              res.json({ message: 'Post updated successfully', post: updatedPost });
            }
          );
        }
      );
    }
  );
});

// Delete post (author or admin only)
router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const postId = req.params.id;
  const userId = req.user.id;
  const userRole = req.user.role;

  // First check if post exists and get author
  db.get(
    'SELECT author_id FROM posts WHERE id = ?',
    [postId],
    (err, post) => {
      if (err) {
        return res.status(500).json({ error: 'Error checking post' });
      }
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Check if user is author or admin
      if (post.author_id !== userId && userRole !== 'admin') {
        return res.status(403).json({ error: 'You can only delete your own posts' });
      }

      // Delete post
      db.run(
        'DELETE FROM posts WHERE id = ?',
        [postId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Error deleting post' });
          }
          res.json({ message: 'Post deleted successfully' });
        }
      );
    }
  );
});

module.exports = router;

