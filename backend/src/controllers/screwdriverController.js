const { Op } = require('sequelize');
const { sequelize, Screwdriver, Attribute, ScrewdriverAttribute } = require('../models');
const logger = require('../config/logger');

const create = async (req, res, next) => {
    const t = await sequelize.transaction();
    
    try {
        logger.info('POST /api/screwdrivers request received');
        logger.info(`Request body: ${JSON.stringify(req.body, null, 2)}`);

        const screwdriverData = req.body;
        const attributesData = screwdriverData.attributes || [];

        if (!screwdriverData.name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        // Create the screwdriver
        const screwdriver = await Screwdriver.create({
            name: screwdriverData.name,
            description: screwdriverData.description,
            state: 'on'
        }, { transaction: t });

        // Create attribute associations
        if (attributesData.length > 0) {
            const attributeValues = attributesData.map(attr => ({
                screwdriver_id: screwdriver.id,
                attribute_id: attr.attributeId,
                value: attr.value,
                state: 'on'
            }));

            await ScrewdriverAttribute.bulkCreate(attributeValues, { transaction: t });
        }

        await t.commit();

        // Fetch the created screwdriver with its attributes
        const createdScrewdriver = await Screwdriver.findByPk(screwdriver.id, {
            include: [{
                model: Attribute,
                through: {
                    model: ScrewdriverAttribute,
                    where: {
                        state: 'on'
                    }
                },
                required: false,
                where: {
                    state: 'on'
                }
            }]
        });

        logger.info(`Created new screwdriver with ID ${screwdriver.id}`);
        res.status(201).json(createdScrewdriver);
    } catch (error) {
        await t.rollback();
        logger.error('Error in createScrewdriver:', error);
        next(error);
    }
};

const getAll = async (req, res, next) => {
    try {
        logger.info('GET /api/screwdrivers request received');
        logger.info(`Query parameters: ${JSON.stringify(req.query, null, 2)}`);

        const whereClause = { state: 'on' };
        if (req.query.include_inactive === 'true') {
            delete whereClause.state;
        }

        const screwdrivers = await Screwdriver.findAll({
            where: whereClause,
            include: [{
                model: Attribute,
                through: {
                    model: ScrewdriverAttribute,
                    where: { state: 'on' }
                },
                required: false
            }],
            order: [['name', 'ASC']]
        });

        logger.info(`Found ${screwdrivers.length} screwdrivers`);
        res.json(screwdrivers);
    } catch (error) {
        logger.error('Error in getAllScrewdrivers:', error);
        res.status(500).json({ error: error.message });
    }
};

const getById = async (req, res) => {
    try {
        logger.info(`GET /api/screwdrivers/${req.params.id} request received`);
        
        const screwdriver = await Screwdriver.findByPk(req.params.id, {
            include: [{
                model: Attribute,
                through: {
                    model: ScrewdriverAttribute,
                    where: { state: 'on' }
                },
                required: false
            }]
        });

        if (!screwdriver) {
            logger.warn(`Screwdriver with ID ${req.params.id} not found`);
            return res.status(404).json({ error: 'Screwdriver not found' });
        }

        logger.info(`Found screwdriver with ID ${req.params.id}`);
        res.json(screwdriver);
    } catch (error) {
        logger.error('Error in getScrewdriverById:', error);
        res.status(500).json({ error: error.message });
    }
};

const update = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        logger.info(`PUT /api/screwdrivers/${req.params.id} request received`);
        logger.info(`Request body: ${JSON.stringify(req.body, null, 2)}`);

        const { name, description, attributes, state } = req.body;
        const screwdriver = await Screwdriver.findOne({
            where: {
                id: req.params.id
            }
        });

        if (!screwdriver) {
            logger.warn(`Screwdriver with ID ${req.params.id} not found`);
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

        logger.info(`Updated screwdriver with ID ${screwdriver.id}`);
        res.json(result);
    } catch (error) {
        await t.rollback();
        logger.error('Error in updateScrewdriver:', error);
        res.status(400).json({ error: error.message });
    }
};

const remove = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        logger.info(`DELETE /api/screwdrivers/${req.params.id} request received`);

        const screwdriver = await Screwdriver.findOne({
            where: {
                id: req.params.id,
                deleted_at: null
            }
        });
        
        if (!screwdriver) {
            logger.warn(`Screwdriver with ID ${req.params.id} not found`);
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
        logger.info(`Soft deleted screwdriver with ID ${screwdriver.id}`);
        res.json({ message: 'Screwdriver deactivated successfully' });
    } catch (error) {
        await t.rollback();
        logger.error('Error in deleteScrewdriver:', error);
        res.status(500).json({ error: error.message });
    }
};

const filterByAttributes = async (req, res, next) => {
    try {
        const { attributes } = req.query;

        if (!attributes) {
            return res.status(400).json({ error: 'Attributes query parameter is required' });
        }

        // Parse the attributes query parameter
        // Expected format: attributeId1:value1,attributeId2:value2
        const attributeFilters = attributes.split(',').map(filter => {
            const [attributeId, value] = filter.split(':');
            return {
                attributeId: parseInt(attributeId),
                value: value
            };
        });

        // Find screwdrivers that match ALL the attribute filters
        const screwdrivers = await Screwdriver.findAll({
            where: {
                state: 'on'
            },
            include: [{
                model: Attribute,
                through: {
                    model: ScrewdriverAttribute,
                    where: {
                        state: 'on'
                    }
                },
                where: {
                    state: 'on',
                    deleted_at: null
                },
                required: true
            }],
            having: sequelize.literal(`COUNT(DISTINCT "Attributes"."id") = ${attributeFilters.length}`),
            group: ['Screwdriver.id']
        });

        // Filter screwdrivers that match all attribute values
        const filteredScrewdrivers = screwdrivers.filter(screwdriver => {
            return attributeFilters.every(filter => {
                const attribute = screwdriver.Attributes.find(attr => attr.id === filter.attributeId);
                return attribute && attribute.ScrewdriverAttribute.value === filter.value;
            });
        });

        res.json(filteredScrewdrivers);
    } catch (error) {
        console.error('Error filtering screwdrivers by attributes:', error);
        next(error);
    }
};

const getAllWithValues = async (req, res, next) => {
  try {
    const includeInactive = req.query.include_inactive === 'true';

    const screwdrivers = await Screwdriver.findAll({
      where: includeInactive ? {} : { state: 'on' },
      include: [
        {
          model: Attribute,
          through: {
            model: ScrewdriverAttribute,
            attributes: ['value', 'state'],
            where: includeInactive ? {} : { state: 'on' }
          },
          required: false,
          attributes: ['id', 'name', 'description', 'data_type', 'is_required', 'state']
        }
      ],
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'description', 'state', 'created_at', 'updated_at']
    });

    const transformed = screwdrivers.map(screwdriver => {
      const plain = screwdriver.get({ plain: true });
      return {
        ...plain,
        attributes: plain.Attributes.map(attr => ({
          id: attr.id,
          name: attr.name,
          description: attr.description,
          data_type: attr.data_type,
          is_required: attr.is_required,
          state: attr.state,
          value: attr.ScrewdriverAttribute?.value
        }))
      };
    });

    res.json(transformed);
  } catch (error) {
    console.error('Error getting all screwdrivers with values:', error);
    next(error);
  }
};


module.exports = {
    create,
    getAll,
    getById,
    update,
    remove,
    filterByAttributes,
    getAllWithValues
}; 