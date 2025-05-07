const { Op } = require('sequelize');
const { sequelize, Auftrag, Screwdriver } = require('../models');
const logger = require('../utils/logger');

/**
 * Get all auftraege with pagination and filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAll = async (req, res) => {
    try {
        logger.info('GET /api/auftraege request received');
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        
        // Build where clause based on filters
        const where = {};
        
        if (req.query.controller_type) {
            where.controller_type = req.query.controller_type;
        }
        
        if (req.query.result) {
            where.result = req.query.result;
        }
        
        if (req.query.id_code) {
            where.id_code = { [Op.like]: `%${req.query.id_code}%` };
        }
        
        if (req.query.date_from && req.query.date_to) {
            where.date = {
                [Op.between]: [new Date(req.query.date_from), new Date(req.query.date_to)]
            };
        } else if (req.query.date_from) {
            where.date = { [Op.gte]: new Date(req.query.date_from) };
        } else if (req.query.date_to) {
            where.date = { [Op.lte]: new Date(req.query.date_to) };
        }
        
        // Get total count
        const count = await Auftrag.count({ where: where });
        
        // Get paginated results
        const auftraege = await Auftrag.findAll({
            where: where,
            include: [{
                model: Screwdriver,
                as: 'screwdriver',
                attributes: ['id', 'name'],
                required: false
            }],
            order: [['date', 'DESC']],
            limit,
            offset
        });
        
        res.status(200).json({
            total: count,
            page,
            limit,
            total_pages: Math.ceil(count / limit),
            data: auftraege
        });
    } catch (error) {
        logger.error('Error in getAll:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get a single auftrag by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getById = async (req, res) => {
    try {
        logger.info(`GET /api/auftraege/${req.params.id} request received`);
        
        const auftrag = await Auftrag.findByPk(req.params.id, {
            include: [{
                model: Screwdriver,
                as: 'screwdriver',
                attributes: ['id', 'name'],
                required: false
            }]
        });
        
        if (!auftrag) {
            logger.warn(`Auftrag with ID ${req.params.id} not found`);
            return res.status(404).json({ error: 'Auftrag not found' });
        }
        
        logger.info(`Found auftrag with ID ${req.params.id}`);
        res.status(200).json(auftrag);
    } catch (error) {
        logger.error('Error in getById:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get statistics for auftraege
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getStatistics = async (req, res) => {
    try {
        logger.info('GET /api/auftraege/statistics/overview request received');
        
        // Get total count
        const totalCount = await Auftrag.count();
        
        // Get counts by controller type
        const controllerTypeCounts = await Auftrag.findAll({
            attributes: [
                'controller_type',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['controller_type'],
            raw: true
        });
        
        // Get counts by result
        const resultCounts = await Auftrag.findAll({
            attributes: [
                'result',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['result'],
            raw: true
        });
        
        // Get counts by date (last 7 days)
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        
        const dateCounts = await Auftrag.findAll({
            attributes: [
                [sequelize.fn('DATE', sequelize.col('date')), 'date'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: {
                date: { [Op.between]: [sevenDaysAgo, today] }
            },
            group: [sequelize.fn('DATE', sequelize.col('date'))],
            raw: true
        });
        
        // Get counts by result and controller type
        const resultByControllerType = await Auftrag.findAll({
            attributes: [
                'controller_type',
                'result',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['controller_type', 'result'],
            raw: true
        });
        
        // Get average torque and angle values by controller type
        const avgValues = await Auftrag.findAll({
            attributes: [
                'controller_type',
                [sequelize.fn('AVG', sequelize.col('actual_torque')), 'avg_torque'],
                [sequelize.fn('AVG', sequelize.col('actual_angle')), 'avg_angle']
            ],
            group: ['controller_type'],
            raw: true
        });
        
        res.status(200).json({
            total_count: totalCount,
            controller_type_counts: controllerTypeCounts,
            result_counts: resultCounts,
            date_counts: dateCounts,
            result_by_controller_type: resultByControllerType,
            avg_values: avgValues
        });
    } catch (error) {
        logger.error('Error in getStatistics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Placeholder for the process payload function
// This is just a stub that returns a 501 Not Implemented status
const processPayload = async (req, res) => {
    logger.info('POST /api/auftraege/process request received');
    res.status(501).json({ 
        error: 'Not implemented', 
        message: 'The payload processing functionality is currently disabled.'
    });
};

// Placeholder for the process batch function
// This is just a stub that returns a 501 Not Implemented status
const processBatch = async (req, res) => {
    logger.info('POST /api/auftraege/process-batch request received');
    res.status(501).json({ 
        error: 'Not implemented', 
        message: 'The batch processing functionality is currently disabled.'
    });
};

module.exports = {
    getAll,
    getById,
    getStatistics,
    processPayload,
    processBatch
};
