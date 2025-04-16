const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const AttributeValue = sequelize.define('AttributeValue', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        screwdriver_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'screwdrivers',
                key: 'id'
            }
        },
        attribute_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'attributes',
                key: 'id'
            }
        },
        value: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    }, {
        tableName: 'attribute_values',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                unique: true,
                fields: ['screwdriver_id', 'attribute_id']
            }
        ]
    });

    return AttributeValue;
}; 