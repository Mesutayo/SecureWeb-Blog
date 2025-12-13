import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './PostDetail.css';
import DOMPurify from 'dompurify';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await axios.get(`/api/posts/${id}`);
      setPost(response.data.post);
    } catch (err) {
      setError('Post not found');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    setDeleting(true);
    try {
      await axios.delete(`/api/posts/${id}`);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete post');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading post...</div>;
  }

  if (error && !post) {
    return <div className="error">{error}</div>;
  }

  if (!post) {
    return null;
  }

  const canEdit = user && (user.id === post.author_id || user.role === 'admin');

  return (
    <div className="post-detail">
      <Link to="/" className="back-link">← Back to Posts</Link>
      <article className="post-content">
        <h1>{post.title}</h1>
        <div className="post-meta">
          <span className="post-author">By {post.author_name}</span>
          <span className="post-date">
            {new Date(post.created_at).toLocaleString()}
          </span> 
        </div>
        <div 
          className="post-body" 
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
        />
        {canEdit && (
          <div className="post-actions">
            <Link to={`/edit/${post.id}`} className="btn btn-primary">
              Edit Post
            </Link>
            <button
              onClick={handleDelete}
              className="btn btn-danger"
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Post'}
            </button>
          </div>
        )}
      </article>
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default PostDetail;

