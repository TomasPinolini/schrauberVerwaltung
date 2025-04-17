const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Screwdriver = sequelize.define('Screwdriver', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    state: {
        type: DataTypes.ENUM('on', 'off'),
        defaultValue: 'on'
    }
}, {
    tableName: 'screwdrivers',
    timestamps: true
});

// Define the ScrewdriverAttribute through table
const ScrewdriverAttribute = sequelize.define('ScrewdriverAttribute', {
    value: {
        type: DataTypes.STRING,
        allowNull: false
    },
    state: {
        type: DataTypes.ENUM('on', 'off'),
        defaultValue: 'on'
    }
}, {
    tableName: 'screwdriver_attributes',
    timestamps: true
});

module.exports = { Screwdriver, ScrewdriverAttribute }; 