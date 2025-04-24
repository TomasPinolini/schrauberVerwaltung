require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const winston = require('winston');
const path = require('path');
const { errorHandler } = require('./middleware/errorHandler');
const { sequelize } = require('./config/database');

// Configure Winston logger with custom format
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message }) => {
                    return `[${timestamp}] ${level}: ${message}`;
                })
            )
        }),
        new winston.transports.File({ 
            filename: 'error.log', 
            level: 'error',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        }),
        new winston.transports.File({ 
            filename: 'combined.log',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        })
    ]
});

// Custom morgan format for HTTP requests
morgan.token('body', (req) => {
    return JSON.stringify(req.body);
});

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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

// Import routes
const screwdriverRoutes = require('./routes/screwdriverRoutes');
const attributeRoutes = require('./routes/attributeRoutes');
const attributeValueRoutes = require('./routes/attributeValueRoutes');
const logRoutes = require('./routes/logRoutes');

// API Routes
app.use('/api/screwdrivers', screwdriverRoutes);
app.use('/api/attributes', attributeRoutes);
app.use('/api/attribute-values', attributeValueRoutes);
app.use('/api', logRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Test database connection endpoint
app.get('/test-db', async (req, res) => {
    try {
        const result = await sequelize.query('SELECT 1 + 1 AS result');
        logger.info('Database connection test successful');
        res.status(200).json({ 
            status: 'ok',
            message: 'Database connection successful',
            result: result[0][0].result
        });
    } catch (error) {
        logger.error('Database connection test failed:', error);
        res.status(500).json({ 
            status: 'error',
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
    logger.warn(`Route not found: ${req.method} ${req.url}`);
    res.status(404).json({ 
        status: 'error',
        error: {
            message: 'Not found',
            code: 'ROUTE_NOT_FOUND'
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info('Database connection test initiated...');
    sequelize.query('SELECT 1 + 1 AS result')
        .then(() => logger.info('Database connection established successfully'))
        .catch(err => logger.error('Database connection failed:', err));
});

module.exports = app; 