const { sequelize } = require('../config/database');

// Import models
const Screwdriver = require('./Screwdriver')(sequelize, require('sequelize').DataTypes);
const Attribute = require('./Attribute')(sequelize, require('sequelize').DataTypes);
const ScrewdriverAttribute = require('./ScrewdriverAttribute')(sequelize, require('sequelize').DataTypes);
const AttributeValue = require('./AttributeValue')(sequelize, require('sequelize').DataTypes);
const ActivityLog = require('./ActivityLog')(sequelize, require('sequelize').DataTypes);
const Auftrag = require('./auftrag')(sequelize, require('sequelize').DataTypes);

// Set up associations
Screwdriver.associate({ Attribute, ScrewdriverAttribute, Auftrag });
Attribute.associate({ Screwdriver, ScrewdriverAttribute, AttributeValue });
ScrewdriverAttribute.associate({ Screwdriver, Attribute });
AttributeValue.associate({ Attribute });
Auftrag.associate({ Screwdriver });

module.exports = {
    sequelize,
    Screwdriver,
    Attribute,
    ScrewdriverAttribute,
    AttributeValue,
    ActivityLog,
    Auftrag
};