const { AttributeValue, Screwdriver, Attribute } = require('../models');
const { Op } = require('sequelize');

exports.updateValues = async (req, res) => {
    try {
        const { screwdriver_id } = req.params;
        const { values } = req.body;

        // Validate screwdriver exists and is an instance
        const screwdriver = await Screwdriver.findByPk(screwdriver_id);
        if (!screwdriver) {
            return res.status(404).json({ message: 'Screwdriver not found' });
        }
        if (screwdriver.type !== 'instance') {
            return res.status(400).json({ message: 'Can only set attributes on instances' });
        }

        // Get all parent categories up to root
        const parentCategories = [];
        let currentId = screwdriver.parent_id;
        
        while (currentId) {
            const category = await Screwdriver.findByPk(currentId);
            if (!category || category.type !== 'category') break;
            parentCategories.push(category.id);
            currentId = category.parent_id;
        }

        // Get all required attributes from parent categories
        const requiredAttributes = await Attribute.findAll({
            where: { 
                is_required: true,
                state: 'on',
                screwdriver_id: {
                    [Op.in]: parentCategories
                }
            }
        });

        // Check if all required attributes are provided with non-empty values
        const providedValues = new Map(values.map(v => [v.attribute_id, v.value]));
        const missingRequired = requiredAttributes.filter(attr => {
            const value = providedValues.get(attr.id);
            return !value || value.trim() === '';
        });

        if (missingRequired.length > 0) {
            return res.status(400).json({
                message: 'Missing required attributes',
                missing: missingRequired.map(attr => attr.name)
            });
        }

        // Get all attributes to validate format
        const allAttributes = await Attribute.findAll({
            where: {
                id: {
                    [Op.in]: values.map(v => v.attribute_id)
                }
            }
        });

        // Create a map for quick attribute lookup
        const attributeMap = new Map(allAttributes.map(attr => [attr.id, attr]));

        // Validate each value against its attribute's format
        for (const value of values) {
            const attribute = attributeMap.get(value.attribute_id);
            if (!attribute) {
                return res.status(400).json({ 
                    message: `Attribute ${value.attribute_id} not found` 
                });
            }

            if (attribute.format_data && value.value) {
                try {
                    const regex = new RegExp(attribute.format_data);
                    if (!regex.test(value.value)) {
                        return res.status(400).json({
                            message: `Invalid format for attribute ${attribute.name}`,
                            expected: attribute.format_data,
                            received: value.value
                        });
                    }
                } catch (e) {
                    console.error('Invalid regex pattern:', attribute.format_data);
                    return res.status(500).json({
                        message: `Invalid format pattern for attribute ${attribute.name}`
                    });
                }
            }
        }

        // Delete existing values
        await AttributeValue.destroy({
            where: { screwdriver_id }
        });

        // Create new values
        await AttributeValue.bulkCreate(
            values.map(v => ({
                screwdriver_id,
                attribute_id: v.attribute_id,
                value: v.value.trim()
            }))
        );

        // Fetch the updated instance with its values
        const updatedInstance = await Screwdriver.findByPk(screwdriver_id, {
            include: [{
                model: AttributeValue,
                include: [{
                    model: Attribute,
                    attributes: ['name', 'format_data']
                }]
            }]
        });

        res.json({
            message: 'Attribute values updated successfully',
            instance: updatedInstance
        });
    } catch (error) {
        console.error('Error in updateValues:', error);
        res.status(500).json({ 
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}; 