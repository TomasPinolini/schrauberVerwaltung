const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attribute = sequelize.define('Attribute', {
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
    data_type: {
        type: DataTypes.ENUM('string', 'number', 'boolean', 'date'),
        allowNull: false
    },
    validation_pattern: {
        type: DataTypes.STRING,
        allowNull: true
    },
    is_required: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    state: {
        type: DataTypes.ENUM('on', 'off'),
        defaultValue: 'on'
    }
}, {
    tableName: 'attributes',
    timestamps: true,
    underscored: true
});

module.exports = Attribute; 