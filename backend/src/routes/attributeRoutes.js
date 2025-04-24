const express = require('express');
const router = express.Router();
const attributeController = require('../controllers/attributeController');

// CRUD routes
router.post('/', attributeController.createAttribute);
router.get('/', attributeController.getAllAttributes);
router.get('/active', attributeController.getActiveAttributes);
router.get('/:id', attributeController.getAttribute);
router.put('/:id', attributeController.updateAttribute);
router.delete('/:id', attributeController.deleteAttribute);

// Toggle attribute state
router.patch('/:id/toggle-state', attributeController.toggleAttributeState);

module.exports = router; 