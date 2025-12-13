const cookieParser = require('cookie-parser');
const csrf = require('csurf');

const csrfProtection = csrf({ cookie: true });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const { initDatabase } = require('./database/db');

const app = express();
app.disable("x-powered-by");
const PORT = process.env.PORT || 5050;

// Middleware
let corsOptions = {
  origin: 'http://localhost:3000'
};
app.use(cookieParser());
app.use(csrfProtection);
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize database
initDatabase();
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

