const { sequelize } = require('../config/database');

// Import models
const Screwdriver = require('./Screwdriver')(sequelize, require('sequelize').DataTypes);
const Attribute = require('./Attribute')(sequelize, require('sequelize').DataTypes);
const ScrewdriverAttribute = require('./ScrewdriverAttribute')(sequelize, require('sequelize').DataTypes);
const AttributeValue = require('./AttributeValue')(sequelize, require('sequelize').DataTypes);

// Set up associations
Screwdriver.associate({ Attribute, ScrewdriverAttribute });
Attribute.associate({ Screwdriver, ScrewdriverAttribute, AttributeValue });
ScrewdriverAttribute.associate({ Screwdriver, Attribute });
AttributeValue.associate({ Attribute });

module.exports = {
    sequelize,
    Screwdriver,
    Attribute,
    ScrewdriverAttribute,
    AttributeValue
}; 