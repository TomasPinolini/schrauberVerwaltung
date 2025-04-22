const { Screwdriver, ScrewdriverAttribute, Attribute } = require('../models');
const sequelize = require('../config/database');

const create = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { name, description, attributes } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        // Create the screwdriver
        const screwdriver = await Screwdriver.create({
            name,
            description,
            state: 'on'
        }, { transaction: t });

        // Get all required attributes
        const requiredAttributes = await Attribute.findAll({
            where: {
                is_required: true,
                state: 'on'
            }
        });

        // Check if all required attributes are provided
        const providedAttributeIds = new Set(attributes?.map(attr => attr.attributeId) || []);
        const missingRequired = requiredAttributes.filter(attr => !providedAttributeIds.has(attr.id));

        if (missingRequired.length > 0) {
            throw new Error(`Missing required attributes: ${missingRequired.map(attr => attr.name).join(', ')}`);
        }

        // Store attribute values
        if (attributes && attributes.length > 0) {
            for (const attr of attributes) {
                const attribute = await Attribute.findOne({
                    where: {
                        id: attr.attributeId,
                        state: 'on'
                    }
                });

                if (!attribute) {
                    throw new Error(`Attribute with id ${attr.attributeId} not found or inactive`);
                }

                // Basic validation based on data type
                const value = attr.value.toString().trim();
                if (!value) {
                    throw new Error(`Value for attribute ${attribute.name} cannot be empty`);
                }

                // Validate based on data type
                switch (attribute.data_type) {
                    case 'number':
                        if (isNaN(value)) {
                            throw new Error(`Invalid number value for attribute ${attribute.name}`);
                        }
                        break;
                    case 'boolean':
                        if (value !== 'true' && value !== 'false') {
                            throw new Error(`Invalid boolean value for attribute ${attribute.name}`);
                        }
                        break;
                    case 'date':
                        if (isNaN(new Date(value).getTime())) {
                            throw new Error(`Invalid date value for attribute ${attribute.name}`);
                        }
                        break;
                }

                // Validate pattern if exists
                if (attribute.validation_pattern) {
                    const regex = new RegExp(attribute.validation_pattern);
                    if (!regex.test(value)) {
                        throw new Error(`Invalid format for attribute ${attribute.name}`);
                    }
                }

                await ScrewdriverAttribute.create({
                    screwdriver_id: screwdriver.id,
                    attribute_id: attr.attributeId,
                    value: value,
                    state: 'on'
                }, { transaction: t });
            }
        }

        await t.commit();

        // Fetch the created screwdriver with its attributes
        const result = await Screwdriver.findOne({
            where: { id: screwdriver.id },
            include: [{
                model: Attribute,
                through: { 
                    attributes: ['value', 'state'],
                    where: { state: 'on' }
                }
            }]
        });

        res.status(201).json(result);
    } catch (error) {
        await t.rollback();
        res.status(400).json({ error: error.message });
    }
};

const getAll = async (req, res) => {
    try {
        const where = {};
        
        // Only filter by state if include_inactive is not true
        if (req.query.include_inactive !== 'true') {
            where.state = req.query.state || 'on';
        }

        console.log('Fetching screwdrivers with query:', where);

        const screwdrivers = await Screwdriver.findAll({
            where,
            include: [{
                model: Attribute,
                through: { 
                    attributes: ['value'],
                    where: { state: 'on' }
                },
                where: {
                    state: 'on'
                },
                required: false
            }],
            order: [['name', 'ASC']]
        });
        
        console.log('Found screwdrivers:', screwdrivers.length);

        // Format the response to include attribute values
        const formattedScrewdrivers = screwdrivers.map(screwdriver => {
            const plainScrewdriver = screwdriver.get({ plain: true });
            return {
                ...plainScrewdriver,
                attributes: plainScrewdriver.Attributes.map(attr => ({
                    attribute_id: attr.id,
                    name: attr.name,
                    description: attr.description,
                    data_type: attr.data_type,
                    validation_pattern: attr.validation_pattern,
                    is_required: attr.is_required,
                    state: attr.state,
                    value: attr.ScrewdriverAttribute.value
                }))
            };
        });

        res.json(formattedScrewdrivers);
    } catch (error) {
        console.error('Error in getAll:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            error: error.message,
            details: error.stack
        });
    }
};

const getById = async (req, res) => {
    try {
        const screwdriver = await Screwdriver.findOne({
            where: { 
                id: req.params.id
            },
            include: [{
                model: Attribute,
                through: { 
                    attributes: ['value', 'state'],
                    where: { state: 'on' }
                },
                required: false
            }]
        });

        if (!screwdriver) {
            return res.status(404).json({ error: 'Screwdriver not found' });
        }

        res.json(screwdriver);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const update = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { name, description, attributes, state } = req.body;
        const screwdriver = await Screwdriver.findOne({
            where: {
                id: req.params.id
            }
        });

        if (!screwdriver) {
            return res.status(404).json({ error: 'Screwdriver not found' });
        }

        // Validate state if provided
        if (state && !['on', 'off'].includes(state)) {
            return res.status(400).json({ error: 'Invalid state. Must be either "on" or "off"' });
        }

        await screwdriver.update({
            name: name || screwdriver.name,
            description: description !== undefined ? description : screwdriver.description,
            state: state || screwdriver.state
        }, { transaction: t });

        if (attributes && attributes.length > 0) {
            // Set existing attribute values to 'off' state
            await ScrewdriverAttribute.update(
                { state: 'off' },
                { 
                    where: { screwdriver_id: screwdriver.id },
                    transaction: t 
                }
            );

            // Add new attribute values
            for (const attr of attributes) {
                const attribute = await Attribute.findOne({
                    where: {
                        id: attr.attributeId,
                        state: 'on'
                    }
                });

                if (!attribute) {
                    throw new Error(`Attribute with id ${attr.attributeId} not found or inactive`);
                }

                // Basic validation based on data type
                const value = attr.value.toString().trim();
                if (!value && attribute.is_required) {
                    throw new Error(`Value for attribute ${attribute.name} cannot be empty`);
                }

                await ScrewdriverAttribute.create({
                    screwdriver_id: screwdriver.id,
                    attribute_id: attr.attributeId,
                    value: value,
                    state: 'on'
                }, { transaction: t });
            }
        }

        await t.commit();

        // Fetch the updated screwdriver with its attributes
        const result = await Screwdriver.findOne({
            where: { id: screwdriver.id },
            include: [{
                model: Attribute,
                through: { 
                    attributes: ['value', 'state'],
                    where: { state: 'on' }
                }
            }]
        });

        res.json(result);
    } catch (error) {
        await t.rollback();
        res.status(400).json({ error: error.message });
    }
};

const remove = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const screwdriver = await Screwdriver.findOne({
            where: {
                id: req.params.id,
                deleted_at: null
            }
        });
        
        if (!screwdriver) {
            return res.status(404).json({ error: 'Screwdriver not found' });
        }

        // Set state to 'off' instead of deleting
        await screwdriver.update({ state: 'off' }, { transaction: t });
        
        // Set all attribute values to 'off'
        await ScrewdriverAttribute.update(
            { state: 'off' },
            { 
                where: { screwdriver_id: screwdriver.id },
                transaction: t 
            }
        );

        await t.commit();
        res.json({ message: 'Screwdriver deactivated successfully' });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove
}; 