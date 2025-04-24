const express = require('express');
const router = express.Router();
const { 
    getAttributeValues, 
    updateAttributeValues,
    getParentAttributeValues,
    createParentAttributeValue,
    updateParentAttributeValue,
    deleteParentAttributeValue
} = require('../controllers/attributeValueController');

// Routes for screwdriver attribute values
router.get('/screwdriver/:screwdriverId/values', getAttributeValues);
router.post('/screwdriver/:screwdriverId/values', updateAttributeValues);
router.put('/screwdriver/:screwdriverId/values', updateAttributeValues);

// Routes for parent attribute values
router.get('/parent/:attributeId/values', getParentAttributeValues);
router.post('/parent/:attributeId/values', createParentAttributeValue);
router.put('/parent/:attributeId/values/:id', updateParentAttributeValue);
router.delete('/parent/:attributeId/values/:id', deleteParentAttributeValue);

module.exports = router; 