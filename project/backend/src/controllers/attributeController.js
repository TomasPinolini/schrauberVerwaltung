const { Attribute, AttributeValue, Screwdriver } = require('../models');
const { Sequelize } = require('sequelize');

// Get all attributes
exports.getAllAttributes = async (req, res) => {
    try {
        const where = { state: 'on' };
        
        // Handle different query parameters
        if (req.query.required === 'true') {
            where.is_required = true;
        }
        
        if (req.query.exact_match) {
            // For exact matching, only return attributes directly assigned to this screwdriver
            where.screwdriver_id = req.query.exact_match;
        } else if (req.query.screwdriver_id) {
            const screwdriverId = req.query.screwdriver_id;
            
            // First, get the current screwdriver and all its parents
            const screwdriver = await Screwdriver.findByPk(screwdriverId);
            if (!screwdriver) {
                return res.status(404).json({ message: 'Screwdriver not found' });
            }

            // Only allow fetching attributes for instances
            if (screwdriver.type !== 'instance') {
                return res.status(400).json({ message: 'Attributes can only be fetched for instances' });
            }

            const parentCategories = [];
            let currentId = screwdriver.parent_id; // Start from parent since we want category attributes
            
            while (currentId) {
                const category = await Screwdriver.findByPk(currentId);
                if (!category || category.type !== 'category') break;
                parentCategories.push({
                    id: category.id,
                    name: category.name
                });
                currentId = category.parent_id;
            }
            
            // Get all attributes that are:
            // 1. Global (no screwdriver_id)
            // 2. Assigned to any parent category
            const attributes = await Attribute.findAll({
                where: {
                    state: 'on',
                    [Sequelize.Op.or]: [
                        { screwdriver_id: null },
                        { screwdriver_id: parentCategories.map(p => p.id) }
                    ]
                },
                include: [{
                    model: Screwdriver,
                    as: 'category',
                    attributes: ['id', 'name', 'type']
                }],
                order: [['name', 'ASC']]
            });
            
            // Add parent category information to each attribute
            const enrichedAttributes = attributes.map(attr => {
                const attribute = attr.toJSON();
                if (attribute.screwdriver_id) {
                    const parentCategory = parentCategories.find(p => p.id === attribute.screwdriver_id);
                    if (parentCategory) {
                        attribute.categoryName = parentCategory.name;
                        attribute.inherited = true;
                    }
                } else {
                    attribute.global = true;
                }
                return attribute;
            });
            
            return res.json(enrichedAttributes);
        }

        const attributes = await Attribute.findAll({
            where,
            include: [{
                model: Screwdriver,
                as: 'category',
                attributes: ['id', 'name', 'type']
            }],
            order: [['name', 'ASC']]
        });
        
        res.json(attributes);
    } catch (error) {
        console.error('Error in getAllAttributes:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get a single attribute
exports.getAttribute = async (req, res) => {
    try {
        const attribute = await Attribute.findByPk(req.params.id, {
            include: [{
                model: Screwdriver,
                as: 'category',
                attributes: ['id', 'name', 'type']
            }]
        });
        if (!attribute) {
            return res.status(404).json({ message: 'Attribute not found' });
        }
        res.json(attribute);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new attribute
exports.createAttribute = async (req, res) => {
    try {
        // Validate regex pattern if provided
        if (req.body.format_data) {
            try {
                new RegExp(req.body.format_data);
            } catch (e) {
                return res.status(400).json({ message: 'Invalid regex pattern' });
            }
        }

        // If screwdriver_id is provided, validate it's a category
        if (req.body.screwdriver_id) {
            const category = await Screwdriver.findByPk(req.body.screwdriver_id);
            if (!category) {
                return res.status(404).json({ message: 'Category not found' });
            }
            if (category.type !== 'category') {
                return res.status(400).json({ message: 'Attributes can only be assigned to categories' });
            }
        }

        const attribute = await Attribute.create(req.body);
        
        // Fetch the created attribute with its relationships
        const createdAttribute = await Attribute.findByPk(attribute.id, {
            include: [{
                model: Screwdriver,
                as: 'category',
                attributes: ['id', 'name', 'type']
            }]
        });
        
        res.status(201).json(createdAttribute);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update an attribute
exports.updateAttribute = async (req, res) => {
    try {
        const attribute = await Attribute.findByPk(req.params.id);
        if (!attribute) {
            return res.status(404).json({ message: 'Attribute not found' });
        }

        // Validate regex pattern if provided
        if (req.body.format_data) {
            try {
                new RegExp(req.body.format_data);
            } catch (e) {
                return res.status(400).json({ message: 'Invalid regex pattern' });
            }
        }

        // If screwdriver_id is provided, validate it's a category
        if (req.body.screwdriver_id) {
            const category = await Screwdriver.findByPk(req.body.screwdriver_id);
            if (!category) {
                return res.status(404).json({ message: 'Category not found' });
            }
            if (category.type !== 'category') {
                return res.status(400).json({ message: 'Attributes can only be assigned to categories' });
            }
        }

        await attribute.update(req.body);
        
        // Fetch the updated attribute with its relationships
        const updatedAttribute = await Attribute.findByPk(req.params.id, {
            include: [{
                model: Screwdriver,
                as: 'category',
                attributes: ['id', 'name', 'type']
            }]
        });
        
        res.json(updatedAttribute);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete (deactivate) an attribute
exports.deleteAttribute = async (req, res) => {
    try {
        const attribute = await Attribute.findByPk(req.params.id);
        if (!attribute) {
            return res.status(404).json({ message: 'Attribute not found' });
        }

        await attribute.update({ state: 'off' });
        res.json({ message: 'Attribute deactivated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 