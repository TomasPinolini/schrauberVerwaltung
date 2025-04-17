const { Attribute } = require('../models');
const sequelize = require('../config/database');

// Get all attributes without any filtering
const getAllAttributes = async (req, res) => {
    try {
        const attributes = await Attribute.findAll({
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
        
        // Debug-Information
        console.log(`Retrieved ${attributes.length} attributes`);
        
        res.json(attributes);
    } catch (error) {
        console.error('Error in getAllAttributes:', error);
        res.status(500).json({ 
            error: 'Internal server error while fetching attributes',
            details: error.message 
        });
    }
};

// Get a single attribute
const getAttribute = async (req, res) => {
    try {
        const attribute = await Attribute.findOne({
            where: {
                id: req.params.id
            }
        });
        
        if (!attribute) {
            return res.status(404).json({ error: 'Attribute not found' });
        }
        res.json(attribute);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create a new attribute
const createAttribute = async (req, res) => {
    const t = await sequelize.transaction();
    try {
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
            is_required,
            state: 'on'
        }, { transaction: t });

        await t.commit();
        res.status(201).json(attribute);
    } catch (error) {
        await t.rollback();
        res.status(400).json({ error: error.message });
    }
};

// Update an attribute
const updateAttribute = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const attribute = await Attribute.findOne({
            where: {
                id: req.params.id
            }
        });

        if (!attribute) {
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
            is_required: is_required !== undefined ? is_required : attribute.is_required,
            state: state || attribute.state
        }, { transaction: t });

        await t.commit();
        res.json(attribute);
    } catch (error) {
        await t.rollback();
        res.status(400).json({ error: error.message });
    }
};

// Delete an attribute (set state to off)
const deleteAttribute = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const attribute = await Attribute.findOne({
            where: {
                id: req.params.id
            }
        });

        if (!attribute) {
            return res.status(404).json({ error: 'Attribute not found' });
        }

        await attribute.update({
            state: 'off'
        }, { transaction: t });

        await t.commit();
        res.json({ message: 'Attribute deactivated successfully' });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllAttributes,
    getAttribute,
    createAttribute,
    updateAttribute,
    deleteAttribute
}; 