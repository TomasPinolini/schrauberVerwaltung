const { Screwdriver, Attribute, ScrewdriverAttribute, AttributeValue } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const logger = require('../config/logger');

// Validate a value based on its attribute's pattern
const validateValue = async (attributeId, value) => {
    const attribute = await Attribute.findOne({
        where: { 
            id: attributeId,
            state: 'on'
        },
        paranoid: true
    });

    if (!attribute) {
        throw new Error('Attribute not found or inactive');
    }

    // Handle null/undefined values
    if (value === null || value === undefined || value.trim() === '') {
        if (attribute.is_required) {
            throw new Error(`Attribute "${attribute.name}" is required`);
        }
        return true;
    }

    // Convert value to string for validation
    const stringValue = String(value).trim();

    // Validate pattern if exists
    if (attribute.validation_pattern) {
        const regex = new RegExp(attribute.validation_pattern);
        if (!regex.test(stringValue)) {
            throw new Error(`Value for "${attribute.name}" does not match the required pattern: ${attribute.validation_pattern}`);
        }
    }

    return true;
};

// Get all attribute values for a screwdriver
const getAttributeValues = async (req, res) => {
    try {
        const { screwdriverId } = req.params;
        
        const values = await ScrewdriverAttribute.findAll({
            where: {
                screwdriver_id: screwdriverId,
                is_current: true,
                state: 'on'
            },
            include: [{
                model: Attribute,
                where: { state: 'on' }
            }]
        });

        res.json(values);
    } catch (error) {
        logger.error('Error getting attribute values:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update attribute values for a screwdriver
const updateAttributeValues = async (req, res) => {
    try {
        const { screwdriverId } = req.params;
        const { values } = req.body;

        // Mark all current values as not current
        await ScrewdriverAttribute.update(
            { is_current: false },
            {
                where: {
                    screwdriver_id: screwdriverId,
                    is_current: true
                }
            }
        );

        // Create new values
        const newValues = await Promise.all(
            values.map(value => 
                ScrewdriverAttribute.create({
                    screwdriver_id: screwdriverId,
                    attribute_id: value.attribute_id,
                    value: value.value,
                    is_current: true,
                    state: 'on'
                })
            )
        );

        res.json(newValues);
    } catch (error) {
        logger.error('Error updating attribute values:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all values for a parent attribute
const getParentAttributeValues = async (req, res) => {
    try {
        const { attributeId } = req.params;

        const attribute = await Attribute.findOne({
            where: { 
                id: attributeId,
                state: 'on'
            }
        });

        if (!attribute) {
            return res.status(404).json({ error: 'Attribute not found' });
        }

        const values = await AttributeValue.findAll({
            where: {
                attribute_id: attributeId,
                state: 'on'
            }
        });

        res.json(values);
    } catch (error) {
        logger.error('Error getting parent attribute values:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create a new value for a parent attribute
const createParentAttributeValue = async (req, res) => {
    try {
        const { attributeId } = req.params;
        const { value, description } = req.body;

        const attribute = await Attribute.findOne({
            where: { 
                id: attributeId,
                state: 'on'
            }
        });

        if (!attribute) {
            return res.status(404).json({ error: 'Attribute not found' });
        }

        // Check if value already exists
        const existingValue = await AttributeValue.findOne({
            where: {
                attribute_id: attributeId,
                value,
                state: 'on'
            }
        });

        if (existingValue) {
            return res.status(400).json({ error: 'Value already exists for this attribute' });
        }

        const newValue = await AttributeValue.create({
            attribute_id: attributeId,
            value,
            description,
            state: 'on'
        });

        res.status(201).json(newValue);
    } catch (error) {
        logger.error('Error creating parent attribute value:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update a parent attribute value
const updateParentAttributeValue = async (req, res) => {
    try {
        const { attributeId, id } = req.params;
        const { value, description } = req.body;

        const attributeValue = await AttributeValue.findOne({
            where: {
                id,
                attribute_id: attributeId,
                state: 'on'
            }
        });

        if (!attributeValue) {
            return res.status(404).json({ error: 'Attribute value not found' });
        }

        // Check if new value already exists (excluding current record)
        const existingValue = await AttributeValue.findOne({
            where: {
                attribute_id: attributeId,
                value,
                id: { [Op.ne]: id },
                state: 'on'
            }
        });

        if (existingValue) {
            return res.status(400).json({ error: 'Value already exists for this attribute' });
        }

        await attributeValue.update({
            value,
            description
        });

        res.json(attributeValue);
    } catch (error) {
        logger.error('Error updating parent attribute value:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete a parent attribute value
const deleteParentAttributeValue = async (req, res) => {
    try {
        const { attributeId, id } = req.params;

        const attributeValue = await AttributeValue.findOne({
            where: {
                id,
                attribute_id: attributeId,
                state: 'on'
            }
        });

        if (!attributeValue) {
            return res.status(404).json({ error: 'Attribute value not found' });
        }

        // First mark as inactive
        await attributeValue.update({ state: 'off' });
        
        // Then soft delete
        await attributeValue.destroy();

        res.status(204).send();
    } catch (error) {
        logger.error('Error deleting parent attribute value:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getAttributeValues,
    updateAttributeValues,
    getParentAttributeValues,
    createParentAttributeValue,
    updateParentAttributeValue,
    deleteParentAttributeValue
}; 