import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './PostList.css';

const PostList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get('/api/posts');
      setPosts(response.data.posts);
    } catch (err) {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading posts...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="post-list">
      <h1>Blog Posts</h1>
      {posts.length === 0 ? (
        <div className="no-posts">No posts yet. Be the first to create one!</div>
      ) : (
        <div className="posts-grid">
          {posts.map((post) => (
            <div key={post.id} className="post-card">
              <Link to={`/post/${post.id}`} className="post-link">
                <h2>{post.title}</h2>
                <p className="post-excerpt">
                  {post.content.length > 150
                    ? post.content.substring(0, 150) + '...'
                    : post.content}
                </p>
                <div className="post-meta">
                  <span className="post-author">By {post.author_name}</span>
                  <span className="post-date">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostList;

