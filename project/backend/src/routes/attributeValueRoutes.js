const express = require('express');
const router = express.Router();
const { getAttributeValues, updateAttributeValues } = require('../controllers/attributeValueController');

// Get all attribute values for a screwdriver
router.get('/screwdriver/:screwdriverId/values', getAttributeValues);

// Create new attribute values for a screwdriver
router.post('/screwdriver/:screwdriverId/values', updateAttributeValues);

// Update attribute values for a screwdriver
router.put('/screwdriver/:screwdriverId/values', updateAttributeValues);

module.exports = router; 