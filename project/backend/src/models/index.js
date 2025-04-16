const { Sequelize } = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(config);

const Screwdriver = require('./Screwdriver')(sequelize);
const Attribute = require('./Attribute')(sequelize);
const AttributeValue = require('./AttributeValue')(sequelize);

// Define associations
Screwdriver.belongsTo(Screwdriver, { as: 'parent', foreignKey: 'parent_id' });
Screwdriver.hasMany(Screwdriver, { as: 'children', foreignKey: 'parent_id' });

AttributeValue.belongsTo(Screwdriver, { foreignKey: 'screwdriver_id' });
AttributeValue.belongsTo(Attribute, { foreignKey: 'attribute_id' });

Screwdriver.hasMany(AttributeValue, { foreignKey: 'screwdriver_id' });
Attribute.hasMany(AttributeValue, { foreignKey: 'attribute_id' });

// Add association between Attribute and Screwdriver
Attribute.belongsTo(Screwdriver, { as: 'category', foreignKey: 'screwdriver_id' });
Screwdriver.hasMany(Attribute, { foreignKey: 'screwdriver_id' });

module.exports = {
    sequelize,
    Screwdriver,
    Attribute,
    AttributeValue
}; 