const express = require('express');
const router = express.Router();
const { ScrewdriverAttribute, Screwdriver, Attribute } = require('../models');
const { Op } = require('sequelize');

// Get all screwdriver logs (changes in screwdriver_attributes)
router.get('/screwdriver-logs', async (req, res) => {
  try {
    const logs = await ScrewdriverAttribute.findAll({
      order: [['updated_at', 'DESC']],
      limit: 50,
      attributes: ['value', 'updated_at', 'is_current'],
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
      new_value: log.value
    }));

    res.json(transformedLogs);
  } catch (error) {
    console.error('Error fetching screwdriver logs:', error);
    res.status(500).json({ message: 'Error fetching screwdriver logs' });
  }
});

module.exports = router; 