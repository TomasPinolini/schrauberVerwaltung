const { AttributeValue, Screwdriver, Attribute } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Neue Validierungsfunktion
const validateAttributeValues = async (values, screwdriver_id) => {
    const errors = [];
    const warnings = [];

    // Get all attributes to validate format
    const allAttributes = await Attribute.findAll({
        where: {
            id: {
                [Op.in]: values.map(v => v.attribute_id)
            },
            state: 'on' // Nur aktive Attribute berücksichtigen
        }
    });

    // Create a map for quick attribute lookup
    const attributeMap = new Map(allAttributes.map(attr => [attr.id, attr]));

    // Validate each value
    for (const value of values) {
        const attribute = attributeMap.get(value.attribute_id);
        
        if (!attribute) {
            errors.push({
                attribute_id: value.attribute_id,
                message: `Attribut nicht gefunden`
            });
            continue;
        }

        // Prüfe, ob der Wert leer ist für erforderliche Attribute
        if (attribute.is_required && (!value.value || value.value.trim() === '')) {
            errors.push({
                attribute_id: value.attribute_id,
                name: attribute.name,
                message: `Das Attribut "${attribute.name}" ist erforderlich und darf nicht leer sein`
            });
            continue;
        }

        // Prüfe das Format, wenn ein Wert vorhanden ist
        if (attribute.format_data && value.value) {
            try {
                const regex = new RegExp(attribute.format_data);
                if (!regex.test(value.value)) {
                    errors.push({
                        attribute_id: value.attribute_id,
                        name: attribute.name,
                        message: `Ungültiges Format für "${attribute.name}". Erwartet: ${attribute.format_data}`,
                        received: value.value
                    });
                }
            } catch (e) {
                warnings.push({
                    attribute_id: value.attribute_id,
                    name: attribute.name,
                    message: `Ungültiges Validierungsmuster für "${attribute.name}": ${attribute.format_data}`
                });
            }
        }
    }

    return { errors, warnings };
};

// Validate a value based on its attribute's data type and pattern
const validateValue = async (attributeId, value) => {
    const attribute = await Attribute.findOne({
        where: { id: attributeId }
    });

    if (!attribute) {
        throw new Error('Attribute not found');
    }

    // Handle null/undefined values
    if (value === null || value === undefined) {
        if (attribute.is_required) {
            throw new Error('This attribute is required');
        }
        return true;
    }

    // Convert value to string for validation
    const stringValue = String(value);

    switch (attribute.data_type) {
        case 'string':
            if (attribute.validation_pattern) {
                const regex = new RegExp(attribute.validation_pattern);
                if (!regex.test(stringValue)) {
                    throw new Error(`Value does not match the required pattern: ${attribute.validation_pattern}`);
                }
            }
            break;

        case 'number':
            if (isNaN(Number(value))) {
                throw new Error('Value must be a number');
            }
            if (attribute.validation_pattern) {
                const numberRegex = new RegExp(attribute.validation_pattern);
                if (!numberRegex.test(stringValue)) {
                    throw new Error(`Number does not match the required pattern: ${attribute.validation_pattern}`);
                }
            }
            break;

        case 'boolean':
            if (typeof value !== 'boolean' && !['true', 'false', '0', '1'].includes(stringValue.toLowerCase())) {
                throw new Error('Value must be a boolean');
            }
            break;

        case 'date':
            const dateValue = new Date(value);
            if (isNaN(dateValue.getTime())) {
                throw new Error('Invalid date format');
            }
            if (attribute.validation_pattern) {
                // For dates, validation_pattern should be in format: YYYY-MM-DD
                const dateRegex = new RegExp(attribute.validation_pattern);
                const formattedDate = dateValue.toISOString().split('T')[0];
                if (!dateRegex.test(formattedDate)) {
                    throw new Error(`Date does not match the required pattern: ${attribute.validation_pattern}`);
                }
            }
            // Ensure date is in 2025
            const year = dateValue.getFullYear();
            if (year !== 2025) {
                throw new Error('Date must be in the year 2025');
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
        const values = await AttributeValue.findAll({
            where: {
                screwdriver_id: req.params.screwdriverId
            },
            include: [{
                model: Attribute,
                where: {
                    state: 'on'
                }
            }]
        });
        res.json(values);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create or update attribute values
const updateAttributeValues = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { screwdriverId } = req.params;
        const values = req.body;

        // Get all active attributes
        const activeAttributes = await Attribute.findAll({
            where: { state: 'on' }
        });

        // Validate required attributes
        const requiredAttributes = activeAttributes.filter(attr => attr.is_required);
        for (const attr of requiredAttributes) {
            if (!values.hasOwnProperty(attr.id.toString())) {
                throw new Error(`Missing required attribute: ${attr.name}`);
            }
        }

        // Process each value
        const results = [];
        for (const [attributeId, value] of Object.entries(values)) {
            // Validate the value
            await validateValue(attributeId, value);

            // Create or update the attribute value
            const [attributeValue, created] = await AttributeValue.findOrCreate({
                where: {
                    screwdriver_id: screwdriverId,
                    attribute_id: attributeId
                },
                defaults: {
                    value: value
                },
                transaction: t
            });

            if (!created) {
                await attributeValue.update({ value }, { transaction: t });
            }

            results.push(attributeValue);
        }

        await t.commit();
        res.json(results);
    } catch (error) {
        await t.rollback();
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getAttributeValues,
    updateAttributeValues,
    validateValue
}; 