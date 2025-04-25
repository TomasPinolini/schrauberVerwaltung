const { Op } = require('sequelize');
const { sequelize, Screwdriver, Attribute, ScrewdriverAttribute, ActivityLog } = require('../models');
const logger = require('../config/logger');

const create = async (req, res, next) => {
    const t = await sequelize.transaction();
    
    try {
        logger.info('POST /api/screwdrivers request received');
        logger.info(`Request body: ${JSON.stringify(req.body, null, 2)}`);

        const screwdriverData = req.body;
        const attributesData = screwdriverData.attributes || [];

        if (!screwdriverData.name) {
            await t.rollback();
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
                is_current: true
            }));

            await ScrewdriverAttribute.bulkCreate(attributeValues, { transaction: t });
        }

        // Fetch the created screwdriver with its current attributes
        const createdScrewdriver = await Screwdriver.findByPk(screwdriver.id, {
            include: [{
                model: Attribute,
                through: {
                    model: ScrewdriverAttribute,
                    where: {
                        is_current: true
                    }
                },
                required: false,
                where: {
                    state: 'on'
                }
            }]
        });

        // Log the creation of the screwdriver
        const logEntry = await ActivityLog.create({
            type: 'screwdriver_create',
            entity_id: screwdriver.id,
            entity_type: 'screwdriver',
            message: `Created screwdriver: ${screwdriver.name}`,
            created_at: new Date()
        }, { transaction: t });
        logEntry.screwdriver_name = screwdriver.name;

        await t.commit();
        logger.info(`Created new screwdriver with ID ${screwdriver.id}`);
        res.status(201).json(createdScrewdriver);
    } catch (error) {
        await t.rollback();
        logger.error('Error creating screwdriver:', error);
        return res.status(500).json({ error: 'Internal server error' });
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
                    attributes: ['value'],
                    where: { 
                        is_current: true
                    }
                },
                required: false,
                where: {
                    state: 'on'
                }
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
                    where: { is_current: true }
                },
                required: false,
                where: {
                    state: 'on'
                }
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
        const { id } = req.params;
        const { name, description, attributes, state } = req.body;

        const screwdriver = await Screwdriver.findOne({
            where: { id },
            include: [{
                model: Attribute,
                through: {
                    model: ScrewdriverAttribute,
                    attributes: ['value', 'is_current', 'updated_at'],
                    where: { is_current: true }
                }
            }]
        });
        if (!screwdriver) {
            await t.rollback();
            return res.status(404).json({ error: 'Screwdriver not found' });
        }

        // Capture original state before update
        const originalState = screwdriver.state;
        const originalName = screwdriver.name;
        const originalDescription = screwdriver.description;

        // Track what is being changed
        let changed = false;
        let details = [];
        let stateChanged = false;

        if (name && name !== originalName) {
            screwdriver.name = name;
            changed = true;
            details.push(`Name changed to '${name}'`);
        }
        if (description !== undefined && description !== originalDescription) {
            screwdriver.description = description;
            changed = true;
            details.push(`Description changed`);
        }
        if (state !== undefined && state !== originalState) {
            screwdriver.state = state;
            stateChanged = true;
            details.push(`State changed to '${state}'`);
        }

        // Attributes logic
        let attributesChanged = false;
        if (attributes && attributes.length > 0) {
            // Set existing attribute values to not current
            await ScrewdriverAttribute.update(
                { is_current: false },
                {
                    where: {
                        screwdriver_id: screwdriver.id,
                        is_current: true
                    },
                    transaction: t
                }
            );
            // Add new attribute values
            for (const attr of attributes) {
                const attributeId = attr.attributeId || attr.id;
                const value = attr.value;
                const attribute = await Attribute.findOne({
                    where: { id: attributeId, state: 'on' }
                });
                if (!attribute) {
                    await t.rollback();
                    throw new Error(`Attribute with id ${attributeId} not found or inactive`);
                }
                if (!value && attribute.is_required) {
                    await t.rollback();
                    throw new Error(`Value for attribute ${attribute.name} cannot be empty`);
                }
                await ScrewdriverAttribute.create({
                    screwdriver_id: screwdriver.id,
                    attribute_id: attributeId,
                    value: value,
                    is_current: true
                }, { transaction: t });
            }
            // Collect attribute names for the update log
            const attributeIds = attributes.map(attr => attr.attributeId || attr.id).filter(Boolean);
            let attributeNames = [];
            if (attributeIds.length > 0) {
                const attrs = await Attribute.findAll({ where: { id: attributeIds }, attributes: ['name'] });
                attributeNames = attrs.map(a => a.name);
            }
            if (attributeNames.length > 0) {
                details.push(`Attributes updated: ${attributeNames.join(', ')}`);
            } else {
                details.push(`Attributes updated`);
            }
            attributesChanged = true;
            changed = true;
        }

        await screwdriver.save({ transaction: t });

        // Now decide what to log
        let logType = null, logMessage = null, logDetails = null;
        // Pure state change (no other edits)
        if (
            stateChanged && !changed && !attributesChanged &&
            !(name && name !== originalName) &&
            !(description !== undefined && description !== originalDescription)
        ) {
            logType = state === 'on' ? 'screwdriver_activate' : 'screwdriver_deactivate';
            logMessage = state === 'on'
                ? `Activated screwdriver: ${screwdriver.name}`
                : `Deactivated screwdriver: ${screwdriver.name}`;
        } else if (changed || attributesChanged) {
            logType = 'screwdriver_update';
            logMessage = `Edited screwdriver: ${screwdriver.name}`;
            logDetails = details.length > 0 ? details.join('; ') : undefined;
        }

        if (logType) {
            const logEntry = await ActivityLog.create({
                type: logType,
                entity_id: screwdriver.id,
                entity_type: 'screwdriver',
                message: logMessage,
                details: logDetails,
                created_at: new Date()
            }, { transaction: t });
            logEntry.screwdriver_name = screwdriver.name;
        }

        // Fetch the updated screwdriver with its current attributes for response
        const result = await Screwdriver.findOne({
            where: { id: screwdriver.id },
            include: [{
                model: Attribute,
                through: {
                    attributes: ['value', 'is_current', 'updated_at'],
                    where: { is_current: true }
                },
                attributes: ['id', 'name', 'description', 'validation_pattern', 'is_required', 'is_parent', 'state']
            }]
        });

        await t.commit();
        logger.info(`Updated screwdriver with ID ${screwdriver.id}`);
        res.json(result);
    } catch (error) {
        await t.rollback();
        logger.error('Error updating screwdriver:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
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
        
        // Log deactivation
        const logEntry = await ActivityLog.create({
            type: 'screwdriver_deactivate',
            entity_id: screwdriver.id,
            entity_type: 'screwdriver',
            message: `Deactivated screwdriver: ${screwdriver.name}`,
            created_at: new Date()
        }, { transaction: t });
        logEntry.screwdriver_name = screwdriver.name;

        // We don't need to modify the attribute values anymore
        // They maintain their is_current status and history

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
                        is_current: true
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
                        attributes: ['value', 'is_current'],
                        where: { is_current: true }
                    },
                    required: false,
                    attributes: ['id', 'name', 'description', 'validation_pattern', 'is_required', 'is_parent', 'state']
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
                    validation_pattern: attr.validation_pattern,
                    is_required: attr.is_required,
                    is_parent: attr.is_parent,
                    state: attr.state,
                    value: attr.ScrewdriverAttribute?.value,
                    is_current: attr.ScrewdriverAttribute?.is_current
                }))
            };
        });

        res.json(transformed);
    } catch (error) {
        console.error('Error getting all screwdrivers with values:', error);
        next(error);
    }
};

// Get distinct values for a parent attribute
const getAttributeValues = async (req, res) => {
    try {
        const { attributeId } = req.params;
        
        const values = await ScrewdriverAttribute.findAll({
            attributes: ['value'],
            where: {
                attribute_id: attributeId,
                is_current: true
            },
            group: ['value'],
            raw: true
        });

        const distinctValues = values.map(v => v.value).filter(Boolean);
        res.json(distinctValues);
    } catch (error) {
        logger.error('Error in getAttributeValues:', error);
        res.status(500).json({ error: error.message });
    }
};

// Add a new method to get attribute history
const getAttributeHistory = async (req, res) => {
    try {
        const { screwdriverId, attributeId } = req.params;

        const history = await ScrewdriverAttribute.findAll({
            where: {
                screwdriver_id: screwdriverId,
                attribute_id: attributeId
            },
            order: [['updated_at', 'DESC']],
            include: [{
                model: Attribute,
                attributes: ['name', 'description']
            }]
        });

        return res.json(history);
    } catch (error) {
        logger.error('Error fetching attribute history:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getOverviewStatistics = async (req, res) => {
    try {
        // Get basic counts
        const totalCount = await Screwdriver.count();
        const activeCount = await Screwdriver.count({ where: { state: 'on' } });
        const inactiveCount = await Screwdriver.count({ where: { state: 'off' } });

        // Get recent activity
        const recentActivity = await ScrewdriverAttribute.findAll({
            limit: 5,
            order: [['updated_at', 'DESC']],
            include: [
                {
                    model: Screwdriver,
                    as: 'Screwdriver',
                    attributes: ['name']
                }
            ]
        });

        // Get attribute usage statistics
        const attributeUsage = await ScrewdriverAttribute.findAll({
            attributes: [
                'attribute_id',
                [sequelize.fn('COUNT', sequelize.col('screwdriver_id')), 'usage_count']
            ],
            where: { is_current: true },
            include: [
                {
                    model: Attribute,
                    as: 'Attribute',
                    attributes: ['name']
                }
            ],
            group: ['attribute_id', 'Attribute.id', 'Attribute.name', 'ScrewdriverAttribute.attribute_id'],
            order: [[sequelize.fn('COUNT', sequelize.col('screwdriver_id')), 'DESC']],
            limit: 5
        });

        // Get creation statistics for the last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const dailyCreation = await Screwdriver.findAll({
            attributes: [
                [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: {
                created_at: {
                    [Op.gte]: sevenDaysAgo
                }
            },
            group: [sequelize.fn('DATE', sequelize.col('created_at'))],
            order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
        });

        res.json({
            counts: {
                total: totalCount,
                active: activeCount,
                inactive: inactiveCount
            },
            recentActivity: recentActivity.map(activity => ({
                screwdriver: activity.Screwdriver.name,
                timestamp: activity.updated_at
            })),
            topAttributes: attributeUsage.map(attr => ({
                name: attr.Attribute.name,
                count: parseInt(attr.dataValues.usage_count)
            })),
            dailyCreation: dailyCreation.map(day => ({
                date: day.dataValues.date,
                count: parseInt(day.dataValues.count)
            }))
        });
    } catch (error) {
        logger.error('Error getting overview statistics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getParentAttributeDistribution = async (req, res) => {
    try {
        const { attributeId } = req.params;

        // First verify this is a parent attribute
        const parentAttribute = await Attribute.findOne({
            where: {
                id: attributeId,
                is_parent: true
            }
        });

        if (!parentAttribute) {
            return res.status(404).json({ error: 'Parent attribute not found' });
        }

        // Get the distribution of values for this attribute
        const distribution = await ScrewdriverAttribute.findAll({
            attributes: [
                'value',
                [sequelize.fn('COUNT', sequelize.col('screwdriver_id')), 'count']
            ],
            where: {
                attribute_id: attributeId,
                is_current: true
            },
            group: ['value'],
            order: [[sequelize.fn('COUNT', sequelize.col('screwdriver_id')), 'DESC']]
        });

        res.json({
            attributeName: parentAttribute.name,
            distribution: distribution.map(item => ({
                value: item.value,
                count: parseInt(item.dataValues.count)
            }))
        });
    } catch (error) {
        logger.error('Error getting attribute distribution:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getParentAttributes = async (req, res) => {
    try {
        const parentAttributes = await Attribute.findAll({
            where: {
                is_parent: true
            },
            attributes: ['id', 'name'],
            order: [['name', 'ASC']]
        });

        res.json(parentAttributes);
    } catch (error) {
        logger.error('Error getting parent attributes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove,
    filterByAttributes,
    getAllWithValues,
    getAttributeValues,
    getAttributeHistory,
    getOverviewStatistics,
    getParentAttributes,
    getParentAttributeDistribution
};