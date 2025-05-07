const express = require('express');
const screwdriverRoutes = require('./screwdriverRoutes');
const attributeRoutes = require('./attributeRoutes');
const attributeValueRoutes = require('./attributeValueRoutes');
const logRoutes = require('./logRoutes');
const auftragRoutes = require('./auftragRoutes');

/**
 * Initialize all API routes
 * @param {Express} app - Express application instance
 */
const initRoutes = (app) => {
    // API Routes
    app.use('/api/screwdrivers', screwdriverRoutes);
    app.use('/api/attributes', attributeRoutes);
    app.use('/api/attribute-values', attributeValueRoutes);
    app.use('/api/auftraege', auftragRoutes);
    app.use('/api', logRoutes);
    
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok' });
    });
    
    // Test database connection endpoint
    app.get('/test-db', async (req, res) => {
        try {
            const sequelize = require('../models').sequelize;
            const result = await sequelize.query('SELECT 1 + 1 AS result');
            console.log('Database connection test successful');
            res.status(200).json({ 
                status: 'ok',
                message: 'Database connection successful',
                result: result[0][0].result
            });
        } catch (error) {
            console.error('Database connection test failed:', error);
            res.status(500).json({ 
                status: 'error',
                message: 'Database connection failed',
                error: error.message
            });
        }
    });
    
    // 404 handler - must be last
    app.use((req, res) => {
        console.warn(`Route not found: ${req.method} ${req.url}`);
        res.status(404).json({ error: 'Not Found' });
    });
};

module.exports = initRoutes;
