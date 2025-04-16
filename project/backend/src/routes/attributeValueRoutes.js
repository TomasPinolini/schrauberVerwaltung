const express = require('express');
const router = express.Router();
const attributeValueController = require('../controllers/attributeValueController');

// Update attribute values for a screwdriver
router.put('/:screwdriver_id', attributeValueController.updateValues);

module.exports = router; 