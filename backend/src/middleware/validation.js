const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            errors: errors.array(),
            message: 'Validation failed'
        });
    }
    next();
};

const paginationValidation = [
    (req, res, next) => {
        const { page, limit } = req.query;
        if (page && isNaN(parseInt(page)) || parseInt(page) < 1) {
            return res.status(400).json({ error: 'Invalid page number' });
        }
        if (limit && isNaN(parseInt(limit)) || parseInt(limit) < 1) {
            return res.status(400).json({ error: 'Invalid limit value' });
        }
        next();
    }
];

const screwdriverValidation = [
    (req, res, next) => {
        const { name, description, attributes } = req.body;
        
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ error: 'Name is required and must be a non-empty string' });
        }
        
        if (description && typeof description !== 'string') {
            return res.status(400).json({ error: 'Description must be a string' });
        }
        
        if (attributes && !Array.isArray(attributes)) {
            return res.status(400).json({ error: 'Attributes must be an array' });
        }
        
        if (attributes) {
            for (const attr of attributes) {
                if (!attr.attributeId || !attr.value) {
                    return res.status(400).json({ 
                        error: 'Each attribute must have an attributeId and value' 
                    });
                }
            }
        }
        
        next();
    }
];

module.exports = {
    validateRequest,
    paginationValidation,
    screwdriverValidation
}; 