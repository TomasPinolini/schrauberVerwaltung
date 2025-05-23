const { Attribute, ActivityLog } = require('../models');
const { sequelize, Sequelize } = require('../config/database');
const logger = require('../config/logger');
const { Op } = require('sequelize');

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
                'validation_pattern',
                'is_required',
                'is_parent',
                'unique',
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

        const { name, description, validation_pattern, is_required, is_parent, unique } = req.body;

        if (!name) {
            await t.rollback();
            return res.status(400).json({ error: 'Name is required' });
        }

        const attribute = await Attribute.create({
            name,
            description,
            validation_pattern,
            is_required,
            is_parent,
            unique: unique !== undefined ? !!unique : false,
            state: 'on'
        }, { transaction: t });

        // Log creation
        await ActivityLog.create({
            type: 'attribute_create',
            entity_id: attribute.id,
            entity_type: 'attribute',
            message: `Created attribute: ${attribute.name}`,
            created_at: new Date()
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

        const { name, description, validation_pattern, is_required, is_parent, unique } = req.body;

        // Validate state if provided
        if (attribute.state !== 'on') {
            return res.status(400).json({ error: 'Attribute must be in "on" state to be updated' });
        }

        await attribute.update({
            name: name || attribute.name,
            description: description !== undefined ? description : attribute.description,
            validation_pattern: validation_pattern !== undefined ? validation_pattern : attribute.validation_pattern,
            is_required: is_required !== undefined ? !!is_required : attribute.is_required,
            is_parent: is_parent !== undefined ? !!is_parent : attribute.is_parent,
            unique: unique !== undefined ? !!unique : attribute.unique,
            state: 'on'
        }, { transaction: t });

        // Log update
        await ActivityLog.create({
            type: 'attribute_update',
            entity_id: attribute.id,
            entity_type: 'attribute',
            message: `Updated attribute: ${attribute.name}`,
            created_at: new Date()
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
                'validation_pattern',
                'is_required',
                'is_parent'
            ]
        });
        
        res.json(attributes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const toggleAttributeState = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        logger.info(`PATCH /api/attributes/${req.params.id}/toggle-state request received`);

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

        const newState = attribute.state === 'on' ? 'off' : 'on';
        
        await attribute.update({
            state: newState
        }, { transaction: t });

        // Log state toggle
        await ActivityLog.create({
            type: 'attribute_toggle_state',
            entity_id: attribute.id,
            entity_type: 'attribute',
            message: `Attribute ${attribute.name} state changed to ${newState}`,
            created_at: new Date()
        }, { transaction: t });

        await t.commit();
        
        // Fetch the updated attribute to ensure we return the current state
        const updatedAttribute = await Attribute.findOne({
            where: { id: req.params.id },
            paranoid: true
        });

        logger.info(`Toggled state of attribute with ID ${attribute.id} to ${newState}`);
        res.json(updatedAttribute);
    } catch (error) {
        await t.rollback();
        logger.error('Error in toggleAttributeState:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllAttributes,
    getAttribute,
    createAttribute,
    updateAttribute,
    deleteAttribute,
    getActiveAttributes,
    toggleAttributeState
}; 