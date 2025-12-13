const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const https = require('https');
const fs = require('fs');

const csrfProtection = csrf({ cookie: true });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const { initDatabase } = require('./database/db');
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.'
});
const app = express();
app.disable("x-powered-by");
const PORT = process.env.PORT || 5050;

if (process.env.NODE_ENV === 'production') {
  const http = require('http');
  
  http.createServer((req, res) => {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
  }).listen(80);
  
  // HTTPS server
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH)
  };
  
  https.createServer(options, app).listen(443, () => {
    console.log('HTTPS server running on port 443');
  });
} else {
  // Development: HTTP only
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
// Middleware
let corsOptions = {
  origin: 'http://localhost:3000'
};
app.use('/api/', apiLimiter);
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

