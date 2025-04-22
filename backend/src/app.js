require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const winston = require('winston');
const path = require('path');

// Import routes
const screwdriverRoutes = require('./routes/screwdriverRoutes');
const attributeRoutes = require('./routes/attributeRoutes');
const attributeValueRoutes = require('./routes/attributeValueRoutes');

// Configure Winston logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost', 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));

// Configure helmet with custom CSP
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: false,
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "blob:", "http://localhost:3000", "http://localhost:3001"],
            connectSrc: ["'self'", "http://localhost:3000", "http://localhost:3001", "http://localhost"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
            baseUri: ["'self'"]
        }
    }
}));

app.use(morgan('dev'));
app.use(express.json({ limit: process.env.MAX_PAYLOAD_SIZE || '10mb' }));
app.use(express.urlencoded({ extended: true }));

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

// API Routes
app.use('/api/screwdrivers', screwdriverRoutes);
app.use('/api/attributes', attributeRoutes);
app.use('/api/attribute-values', attributeValueRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Error:', err);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});

module.exports = app; 