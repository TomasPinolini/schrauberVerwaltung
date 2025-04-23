const { Screwdriver, Attribute, ScrewdriverAttribute } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Validate a value based on its attribute's data type and pattern
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

    switch (attribute.data_type) {
        case 'string':
            if (attribute.validation_pattern) {
                const regex = new RegExp(attribute.validation_pattern);
                if (!regex.test(stringValue)) {
                    throw new Error(`Value for "${attribute.name}" does not match the required pattern: ${attribute.validation_pattern}`);
                }
            }
            break;

        case 'number':
            if (isNaN(Number(stringValue))) {
                throw new Error(`Value for "${attribute.name}" must be a number`);
            }
            if (attribute.validation_pattern) {
                const numberRegex = new RegExp(attribute.validation_pattern);
                if (!numberRegex.test(stringValue)) {
                    throw new Error(`Number for "${attribute.name}" does not match the required pattern: ${attribute.validation_pattern}`);
                }
            }
            break;

        case 'boolean':
            if (!['true', 'false', '0', '1'].includes(stringValue.toLowerCase())) {
                throw new Error(`Value for "${attribute.name}" must be a boolean (true/false)`);
            }
            break;

        case 'date':
            const dateValue = new Date(stringValue);
            if (isNaN(dateValue.getTime())) {
                throw new Error(`Invalid date format for "${attribute.name}"`);
            }
            if (attribute.validation_pattern) {
                const dateRegex = new RegExp(attribute.validation_pattern);
                if (!dateRegex.test(stringValue)) {
                    throw new Error(`Date for "${attribute.name}" does not match the required pattern: ${attribute.validation_pattern}`);
                }
            }
            break;

        default:
            throw new Error(`Unsupported data type: ${attribute.data_type}`);
    }

    return true;
};

// Get all attribute values for a screwdriver
const getAttributeValues = async (req, res) => {
    try {
        const screwdriver = await Screwdriver.findOne({
            where: {
                id: req.params.screwdriverId
            },
            include: [{
                model: Attribute,
                through: {
                    attributes: ['value', 'state'],
                    where: { state: 'on' }
                },
                where: {
                    state: 'on'
                },
                required: false
            }],
            paranoid: true
        });

        if (!screwdriver) {
            return res.status(404).json({ error: 'Screwdriver not found' });
        }

        const formattedValues = screwdriver.Attributes.map(attr => ({
            id: attr.id,
            name: attr.name,
            description: attr.description,
            data_type: attr.data_type,
            validation_pattern: attr.validation_pattern,
            is_required: attr.is_required,
            value: attr.ScrewdriverAttribute.value,
            state: attr.ScrewdriverAttribute.state
        }));

        res.json(formattedValues);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update attribute values for a screwdriver
const updateAttributeValues = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { screwdriverId } = req.params;
        const values = req.body;

        // Check if screwdriver exists
        const screwdriver = await Screwdriver.findOne({
            where: { id: screwdriverId },
            paranoid: true
        });

        if (!screwdriver) {
            throw new Error('Screwdriver not found');
        }

        // Get all active attributes
        const activeAttributes = await Attribute.findAll({
            where: { 
                state: 'on'
            },
            paranoid: true
        });

        // Create a map for quick lookup
        const attributeMap = new Map(activeAttributes.map(attr => [attr.id, attr]));

        // Validate required attributes
        const missingRequired = activeAttributes
            .filter(attr => attr.is_required)
            .filter(attr => !values.some(v => v.attributeId === attr.id && v.value?.trim()));

        if (missingRequired.length > 0) {
            throw new Error(`Missing required attributes: ${missingRequired.map(attr => attr.name).join(', ')}`);
        }

        // Set all current values to inactive
        await ScrewdriverAttribute.update(
            { state: 'off' },
            { 
                where: { screwdriver_id: screwdriverId },
                transaction: t 
            }
        );

        // Process each value
        const results = [];
        for (const value of values) {
            // Validate the value
            await validateValue(value.attributeId, value.value);

            // Create new attribute value
            const attributeValue = await ScrewdriverAttribute.create({
                screwdriver_id: screwdriverId,
                attribute_id: value.attributeId,
                value: value.value.trim(),
                state: 'on'
            }, { transaction: t });

            results.push({
                attribute: attributeMap.get(value.attributeId)?.name,
                value: value.value,
                status: 'success'
            });
        }

        await t.commit();
        res.json({
            message: 'Attribute values updated successfully',
            results
        });
    } catch (error) {
        await t.rollback();
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getAttributeValues,
    updateAttributeValues
}; 