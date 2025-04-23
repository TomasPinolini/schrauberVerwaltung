const express = require('express');
const router = express.Router();
const screwdriverController = require('../controllers/screwdriverController');

// CRUD routes
router.post('/', screwdriverController.create);
router.get('/', screwdriverController.getAll);
router.get('/:id', screwdriverController.getById);
router.put('/:id', screwdriverController.update);
router.delete('/:id', screwdriverController.remove);

// New routes for advanced queries
router.get('/filter/by-attributes', screwdriverController.filterByAttributes);
router.get('/with-values/all', screwdriverController.getAllWithValues);

module.exports = router; 