require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const path = require('path');
const { errorHandler } = require('./middleware/errorHandler');
const { sequelize } = require('./config/database');
const logger = require('./utils/logger');

// Custom morgan format for HTTP requests
morgan.token('body', (req) => {
    return JSON.stringify(req.body);
});

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configure helmet with custom CSP
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: false,
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'", "http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
            baseUri: ["'self'"]
        }
    }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom logging middleware
app.use((req, res, next) => {
    logger.info(`Incoming ${req.method} request to ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
        logger.info(`Request body: ${JSON.stringify(req.body, null, 2)}`);
    }
    next();
});

app.use(morgan('dev'));

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../../frontend')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize all routes from centralized route handler
const initRoutes = require('./routes');
initRoutes(app);

// Error handling middleware
app.use(errorHandler);

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info('Database connection test initiated...');
    sequelize.query('SELECT 1 + 1 AS result')
        .then(() => logger.info('Database connection established successfully'))
        .catch(err => logger.error('Database connection failed:', err));
});

module.exports = app; 