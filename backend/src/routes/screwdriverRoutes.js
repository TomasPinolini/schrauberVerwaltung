const express = require('express');
const router = express.Router();
const screwdriverController = require('../controllers/screwdriverController');

// CRUD routes
router.post('/', screwdriverController.create);

// Statistics and attribute routes
router.get('/statistics/overview', screwdriverController.getOverviewStatistics);
router.get('/parent-attributes', screwdriverController.getParentAttributes);
router.get('/parent-attributes/:attributeId/distribution', screwdriverController.getParentAttributeDistribution);
router.get('/filter/by-attributes', screwdriverController.filterByAttributes);
router.get('/with-values/all', screwdriverController.getAllWithValues);
router.get('/attribute-values/:attributeId', screwdriverController.getAttributeValues);

// Base CRUD routes with params
router.get('/', screwdriverController.getAll);
router.get('/:id', screwdriverController.getById);
router.put('/:id', screwdriverController.update);
router.delete('/:id', screwdriverController.remove);

// History routes
router.get('/:screwdriverId/attributes/:attributeId/history', screwdriverController.getAttributeHistory);

module.exports = router;