const { Attribute } = require('../models');
const sequelize = require('../config/database');
const logger = require('../config/logger');

// Get all attributes with optional filtering
const getAllAttributes = async (req, res) => {
    try {
        logger.info('GET /api/attributes request received');
        logger.info(`Query parameters: ${JSON.stringify(req.query, null, 2)}`);

        const whereClause = { state: 'on' };
        if (req.query.include_inactive === 'true') {
            delete whereClause.state;
        }

        const attributes = await Attribute.findAll({
            where: whereClause,
            order: [['name', 'ASC']],
            attributes: [
                'id', 
                'name', 
                'description', 
                'data_type', 
                'validation_pattern', 
                'is_required', 
                'state',
                'created_at',
                'updated_at'
            ]
        });

        logger.info(`Found ${attributes.length} attributes`);
        res.json(attributes);
    } catch (error) {
        logger.error('Error in getAllAttributes:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get a single attribute
const getAttribute = async (req, res) => {
    try {
        logger.info(`GET /api/attributes/${req.params.id} request received`);
        
        const attribute = await Attribute.findOne({
            where: {
                id: req.params.id
            },
            paranoid: true
        });
        
        if (!attribute) {
            logger.warn(`Attribute with ID ${req.params.id} not found`);
            return res.status(404).json({ error: 'Attribute not found' });
        }

        logger.info(`Found attribute with ID ${req.params.id}`);
        res.json(attribute);
    } catch (error) {
        logger.error('Error in getAttribute:', error);
        res.status(500).json({ error: error.message });
    }
};

// Create a new attribute
const createAttribute = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        logger.info('POST /api/attributes request received');
        logger.info(`Request body: ${JSON.stringify(req.body, null, 2)}`);

        const { name, description, data_type, validation_pattern, is_required } = req.body;

        if (!name || !data_type) {
            return res.status(400).json({ error: 'Name and data type are required' });
        }

        // Validate data_type enum
        const validTypes = ['string', 'number', 'boolean', 'date'];
        if (!validTypes.includes(data_type)) {
            return res.status(400).json({ error: 'Invalid data type. Must be one of: ' + validTypes.join(', ') });
        }

        const attribute = await Attribute.create({
            name,
            description,
            data_type,
            validation_pattern,
            is_required: !!is_required,
            state: 'on'
        }, { transaction: t });

        await t.commit();
        logger.info(`Created new attribute with ID ${attribute.id}`);
        res.status(201).json(attribute);
    } catch (error) {
        await t.rollback();
        logger.error('Error in createAttribute:', error);
        res.status(400).json({ error: error.message });
    }
};

// Update an attribute
const updateAttribute = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        logger.info(`PUT /api/attributes/${req.params.id} request received`);
        logger.info(`Request body: ${JSON.stringify(req.body, null, 2)}`);

        const attribute = await Attribute.findOne({
            where: {
                id: req.params.id
            },
            paranoid: true
        });

        if (!attribute) {
            logger.warn(`Attribute with ID ${req.params.id} not found`);
            return res.status(404).json({ error: 'Attribute not found' });
        }

        const { name, description, data_type, validation_pattern, is_required, state } = req.body;

        // Validate data_type if provided
        if (data_type) {
            const validTypes = ['string', 'number', 'boolean', 'date'];
            if (!validTypes.includes(data_type)) {
                return res.status(400).json({ error: 'Invalid data type. Must be one of: ' + validTypes.join(', ') });
            }
        }

        // Validate state if provided
        if (state && !['on', 'off'].includes(state)) {
            return res.status(400).json({ error: 'Invalid state. Must be either "on" or "off"' });
        }

        await attribute.update({
            name: name || attribute.name,
            description: description !== undefined ? description : attribute.description,
            data_type: data_type || attribute.data_type,
            validation_pattern: validation_pattern !== undefined ? validation_pattern : attribute.validation_pattern,
            is_required: is_required !== undefined ? !!is_required : attribute.is_required,
            state: state || attribute.state
        }, { transaction: t });

        await t.commit();
        logger.info(`Updated attribute with ID ${attribute.id}`);
        res.json(attribute);
    } catch (error) {
        await t.rollback();
        logger.error('Error in updateAttribute:', error);
        res.status(400).json({ error: error.message });
    }
};

// Delete an attribute (soft delete)
const deleteAttribute = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        logger.info(`DELETE /api/attributes/${req.params.id} request received`);

        const attribute = await Attribute.findOne({
            where: {
                id: req.params.id
            },
            paranoid: true
        });

        if (!attribute) {
            logger.warn(`Attribute with ID ${req.params.id} not found`);
            return res.status(404).json({ error: 'Attribute not found' });
        }

        // First set state to off
        await attribute.update({
            state: 'off'
        }, { transaction: t });

        // Then perform soft delete
        await attribute.destroy({ transaction: t });

        await t.commit();
        logger.info(`Soft deleted attribute with ID ${attribute.id}`);
        res.json({ message: 'Attribute deleted successfully' });
    } catch (error) {
        await t.rollback();
        logger.error('Error in deleteAttribute:', error);
        res.status(500).json({ error: error.message });
    }
};

const getActiveAttributes = async (req, res) => {
    try {
        const attributes = await Attribute.findAll({
            where: {
                state: 'on'
            },
            order: [['name', 'ASC']],
            attributes: [
                'id', 
                'name', 
                'description', 
                'data_type', 
                'validation_pattern', 
                'is_required'
            ]
        });
        
        res.json(attributes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllAttributes,
    getAttribute,
    createAttribute,
    updateAttribute,
    deleteAttribute,
    getActiveAttributes
}; 