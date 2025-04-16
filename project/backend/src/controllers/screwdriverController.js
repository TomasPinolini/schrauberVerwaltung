const { Screwdriver, Attribute, AttributeValue } = require('../models');

// Get all screwdrivers
exports.getAllScrewdrivers = async (req, res) => {
    try {
        const screwdrivers = await Screwdriver.findAll({
            where: { state: 'on' },
            include: [
                {
                    model: Screwdriver,
                    as: 'parent',
                    attributes: ['id', 'name', 'type']
                },
                {
                    model: Screwdriver,
                    as: 'children',
                    where: { state: 'on' },
                    required: false,
                    attributes: ['id', 'name', 'type', 'parent_id'],
                    include: [{
                        model: Screwdriver,
                        as: 'children',
                        where: { state: 'on' },
                        required: false,
                        attributes: ['id', 'name', 'type', 'parent_id']
                    }]
                }
            ],
            order: [
                ['name', 'ASC'],
                [{ model: Screwdriver, as: 'children' }, 'name', 'ASC'],
                [{ model: Screwdriver, as: 'children' }, { model: Screwdriver, as: 'children' }, 'name', 'ASC']
            ]
        });
        res.json(screwdrivers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get inherited attributes for a category
exports.getInheritedAttributes = async (req, res) => {
    try {
        console.log('Getting inherited attributes for category:', req.params.id);
        const categoryId = req.params.id;
        const category = await Screwdriver.findByPk(categoryId);
        
        if (!category) {
            console.log('Category not found:', categoryId);
            return res.status(404).json({ message: 'Category not found' });
        }

        console.log('Found category:', category.name, 'type:', category.type);
        if (category.type !== 'category') {
            console.log('Invalid type:', category.type);
            return res.status(400).json({ message: 'Can only get attributes from categories' });
        }

        // Get all parent categories up to root
        const parentCategories = [];
        let currentId = category.id; // Start from current category
        
        while (currentId) {
            console.log('Checking category:', currentId);
            const current = await Screwdriver.findByPk(currentId);
            if (!current || current.type !== 'category') break;
            parentCategories.push({
                id: current.id,
                name: current.name
            });
            currentId = current.parent_id;
        }
        
        console.log('Found parent categories:', parentCategories);
        
        // Get all attributes that belong to this category or any parent
        const attributes = await Attribute.findAll({
            where: {
                state: 'on',
                screwdriver_id: parentCategories.map(p => p.id)
            },
            include: [{
                model: Screwdriver,
                as: 'category',
                attributes: ['id', 'name', 'type']
            }],
            order: [['name', 'ASC']]
        });
        
        console.log('Found attributes:', attributes.length);
        
        // Add parent category information to each attribute
        const enrichedAttributes = attributes.map(attr => {
            const attribute = attr.toJSON();
            const parentCategory = parentCategories.find(p => p.id === attribute.screwdriver_id);
            if (parentCategory) {
                attribute.categoryName = parentCategory.name;
                attribute.inherited = attribute.screwdriver_id !== category.id;
            }
            return attribute;
        });
        
        console.log('Sending enriched attributes:', enrichedAttributes.length);
        res.json(enrichedAttributes);
    } catch (error) {
        console.error('Error in getInheritedAttributes:', error);
        res.status(500).json({ 
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Get a single screwdriver
exports.getScrewdriver = async (req, res) => {
    try {
        const screwdriver = await Screwdriver.findByPk(req.params.id, {
            include: [
                {
                    model: Screwdriver,
                    as: 'parent',
                    attributes: ['id', 'name', 'type']
                },
                {
                    model: AttributeValue,
                    include: [Attribute]
                },
                {
                    model: Screwdriver,
                    as: 'children',
                    where: { state: 'on' },
                    required: false,
                    attributes: ['id', 'name', 'type', 'parent_id']
                }
            ]
        });
        if (!screwdriver) {
            return res.status(404).json({ message: 'Screwdriver not found' });
        }
        res.json(screwdriver);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new screwdriver
exports.createScrewdriver = async (req, res) => {
    try {
        const { name, parent_id, type = 'category' } = req.body;

        // Validate parent if provided
        if (parent_id) {
            const parent = await Screwdriver.findByPk(parent_id);
            if (!parent) {
                return res.status(400).json({ message: 'Parent screwdriver not found' });
            }
            // Validate that instances can only be created under categories
            if (type === 'instance' && parent.type !== 'category') {
                return res.status(400).json({ message: 'Instances can only be created under categories' });
            }
            // Validate that categories can only be created under categories
            if (type === 'category' && parent.type !== 'category') {
                return res.status(400).json({ message: 'Categories can only be created under categories' });
            }
        }

        const screwdriver = await Screwdriver.create({ name, parent_id, type });
        
        // Fetch the created screwdriver with its relationships
        const createdScrewdriver = await Screwdriver.findByPk(screwdriver.id, {
            include: [
                {
                    model: Screwdriver,
                    as: 'parent',
                    attributes: ['id', 'name', 'type']
                }
            ]
        });
        
        res.status(201).json(createdScrewdriver);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update a screwdriver
exports.updateScrewdriver = async (req, res) => {
    try {
        const { name, parent_id, type } = req.body;

        const screwdriver = await Screwdriver.findByPk(req.params.id);
        if (!screwdriver) {
            return res.status(404).json({ message: 'Screwdriver not found' });
        }

        // Validate parent if provided
        if (parent_id) {
            const parent = await Screwdriver.findByPk(parent_id);
            if (!parent) {
                return res.status(400).json({ message: 'Parent screwdriver not found' });
            }
            // Validate that instances can only be under categories
            if ((type || screwdriver.type) === 'instance' && parent.type !== 'category') {
                return res.status(400).json({ message: 'Instances can only be under categories' });
            }
            // Validate that categories can only be under categories
            if ((type || screwdriver.type) === 'category' && parent.type !== 'category') {
                return res.status(400).json({ message: 'Categories can only be under categories' });
            }
        }

        await screwdriver.update({ name, parent_id, type });
        
        const updatedScrewdriver = await Screwdriver.findByPk(req.params.id, {
            include: [{
                model: Screwdriver,
                as: 'parent',
                attributes: ['id', 'name', 'type']
            }]
        });
        
        res.json(updatedScrewdriver);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete (deactivate) a screwdriver
exports.deleteScrewdriver = async (req, res) => {
    try {
        const screwdriver = await Screwdriver.findByPk(req.params.id);
        if (!screwdriver) {
            return res.status(404).json({ message: 'Screwdriver not found' });
        }

        // If it's a category, also deactivate all children
        if (screwdriver.type === 'category') {
            await Screwdriver.update(
                { state: 'off' },
                {
                    where: {
                        parent_id: req.params.id
                    }
                }
            );
        }

        await screwdriver.update({ state: 'off' });
        res.json({ message: 'Screwdriver deactivated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Set attribute values for a screwdriver
exports.setAttributeValues = async (req, res) => {
    try {
        const screwdriver = await Screwdriver.findByPk(req.params.id);
        if (!screwdriver) {
            return res.status(404).json({ message: 'Screwdriver not found' });
        }

        // Only allow setting attributes on instances
        if (screwdriver.type !== 'instance') {
            return res.status(400).json({ message: 'Attributes can only be set on instances' });
        }

        const requiredAttributes = await Attribute.findAll({
            where: { is_required: true }
        });

        // Check if all required attributes are provided
        const missingAttributes = requiredAttributes.filter(attr => 
            !(attr.id in req.body)
        );

        if (missingAttributes.length > 0) {
            return res.status(400).json({
                message: 'Missing required attributes',
                missing: missingAttributes.map(attr => attr.name)
            });
        }

        // Validate attribute values against their format
        for (const [attrId, value] of Object.entries(req.body)) {
            const attribute = await Attribute.findByPk(attrId);
            if (!attribute) {
                return res.status(400).json({ message: `Attribute ${attrId} not found` });
            }

            if (attribute.format_data) {
                const regex = new RegExp(attribute.format_data);
                if (!regex.test(value)) {
                    return res.status(400).json({
                        message: `Invalid format for attribute ${attribute.name}`,
                        expected: attribute.format_data
                    });
                }
            }
        }

        // Update or create attribute values
        for (const [attrId, value] of Object.entries(req.body)) {
            await AttributeValue.upsert({
                screwdriver_id: req.params.id,
                attribute_id: attrId,
                value
            });
        }

        res.json({ message: 'Attribute values updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 