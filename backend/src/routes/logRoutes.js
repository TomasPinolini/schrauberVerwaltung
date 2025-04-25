const express = require('express');
const router = express.Router();
const { ScrewdriverAttribute, Screwdriver, Attribute, ActivityLog } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Get all screwdriver logs (changes in screwdriver_attributes)
router.get('/screwdriver-logs', async (req, res) => {
  try {
    const logs = await ScrewdriverAttribute.findAll({
      order: [['updated_at', 'DESC']],
      limit: 50,
      attributes: ['value', 'updated_at', 'is_current', 'previous_value'],
      include: [
        {
          model: Screwdriver,
          as: 'Screwdriver',
          attributes: ['name']
        },
        {
          model: Attribute,
          as: 'Attribute',
          attributes: ['name']
        }
      ],
      where: {
        [Op.or]: [
          { is_current: false },  // Include historical records
          { updated_at: { [Op.gt]: new Date(Date.now() - 24 * 60 * 60 * 1000) } }  // Include new records from last 24h
        ]
      }
    });

    // Transform the data to match our frontend expectations
    const transformedLogs = logs.map(log => ({
      created_at: log.updated_at, // We'll use updated_at as created_at for the frontend
      screwdriver_name: log.Screwdriver.name,
      attribute_name: log.Attribute.name,
      new_value: log.value,
      previous_value: log.previous_value,
      is_current: log.is_current
    }));

    res.json(transformedLogs);
  } catch (error) {
    logger.error('Error fetching screwdriver logs:', error);
    res.status(500).json({ message: 'Error fetching screwdriver logs' });
  }
});

// Get all generic activity logs (not just attribute changes)
router.get('/activity-logs', async (req, res) => {
  try {
    // Fetch logs
    const logs = await ActivityLog.findAll({
      order: [['created_at', 'DESC']],
      limit: 50
    });

    // Get all relevant screwdriver IDs from logs
    const screwdriverIds = logs
      .filter(log => log.entity_type === 'screwdriver')
      .map(log => log.entity_id);

    let screwdriverMap = {};
    if (screwdriverIds.length > 0) {
      const screwdrivers = await Screwdriver.findAll({
        where: { id: screwdriverIds },
        attributes: ['id', 'name']
      });
      screwdriverMap = screwdrivers.reduce((acc, screwdriver) => {
        acc[screwdriver.id] = screwdriver.name;
        return acc;
      }, {});
    }

    // Attach screwdriver_name if relevant
    const logsWithNames = logs.map(log => {
      if (log.entity_type === 'screwdriver') {
        // If not already set, fetch the name from the mapping or fallback to entity_id
        log.screwdriver_name = log.screwdriver_name || screwdriverMap[log.entity_id] || String(log.entity_id);
      }
      return log.toJSON();
    });

    res.json(logsWithNames);
  } catch (error) {
    logger.error('Error fetching activity logs:', error);
    res.status(500).json({ message: 'Error fetching activity logs' });
  }
});

module.exports = router; 