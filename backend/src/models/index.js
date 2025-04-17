const { Screwdriver, ScrewdriverAttribute } = require('./Screwdriver');
const Attribute = require('./attribute');

// Define relationships
Screwdriver.belongsToMany(Attribute, { 
    through: ScrewdriverAttribute,
    foreignKey: 'screwdriver_id'
});
Attribute.belongsToMany(Screwdriver, { 
    through: ScrewdriverAttribute,
    foreignKey: 'attribute_id'
});

module.exports = {
    Screwdriver,
    Attribute,
    ScrewdriverAttribute
}; 