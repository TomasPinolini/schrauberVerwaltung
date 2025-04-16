const express = require('express');
const router = express.Router();
const attributeController = require('../controllers/attributeController');

// Get all attributes
router.get('/', attributeController.getAllAttributes);

// Get a single attribute
router.get('/:id', attributeController.getAttribute);

// Create a new attribute
router.post('/', attributeController.createAttribute);

// Update an attribute
router.put('/:id', attributeController.updateAttribute);

// Delete an attribute
router.delete('/:id', attributeController.deleteAttribute);

module.exports = router; 