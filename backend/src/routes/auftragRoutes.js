const express = require('express');
const auftragController = require('../controllers/auftragController');

const router = express.Router();

// Get statistics for auftraege (specific route must come before dynamic routes)
router.get('/statistics/overview', auftragController.getStatistics);

// Get all auftraege with pagination and filtering
router.get('/', auftragController.getAll);

// Get a single auftrag by ID
router.get('/:id', auftragController.getById);

// Process a single payload (currently disabled)
router.post('/process', auftragController.processPayload);

// Process a batch of payloads from a file (currently disabled)
router.post('/process-batch', auftragController.processBatch);

module.exports = router;
