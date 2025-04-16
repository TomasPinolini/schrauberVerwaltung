const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const screwdriverRoutes = require('./routes/screwdriverRoutes');
const attributeRoutes = require('./routes/attributeRoutes');
const attributeValueRoutes = require('./routes/attributeValueRoutes');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
    origin: ['http://localhost:3001', 'http://localhost:3002'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes - these must come BEFORE static file serving
app.use('/api/screwdrivers', screwdriverRoutes);
app.use('/api/attributes', attributeRoutes);
app.use('/api/attribute-values', attributeValueRoutes);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../../frontend/build')));

// Handle React routing, return all requests to React app
// This must come AFTER all API routes
app.get('*', (req, res) => {
    // Only serve index.html for non-API routes
    if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, '../../frontend/build', 'index.html'));
    }
});

// Database connection and server start
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
        
        // Sync all models
        await sequelize.sync();
        console.log('All models were synchronized successfully.');

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

startServer(); 