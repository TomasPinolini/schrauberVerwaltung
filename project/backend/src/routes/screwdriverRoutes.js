const express = require('express');
const router = express.Router();
const screwdriverController = require('../controllers/screwdriverController');

// Get all screwdrivers
router.get('/', screwdriverController.getAllScrewdrivers);

// Get a single screwdriver
router.get('/:id', screwdriverController.getScrewdriver);

// Get inherited attributes for a category
router.get('/:id/inherited-attributes', screwdriverController.getInheritedAttributes);

// Create a new screwdriver
router.post('/', screwdriverController.createScrewdriver);

// Update a screwdriver
router.put('/:id', screwdriverController.updateScrewdriver);

// Delete a screwdriver
router.delete('/:id', screwdriverController.deleteScrewdriver);

// Set attribute values for a screwdriver
router.post('/:id/attributes', screwdriverController.setAttributeValues);

module.exports = router; 