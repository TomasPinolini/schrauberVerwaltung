const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ScrewdriverAttribute extends Model {
        static associate(models) {
            // Associations are defined in the index.js file
        }
    }

    ScrewdriverAttribute.init({
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
            type: DataTypes.STRING,
            allowNull: false
        },
        is_current: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
        sequelize,
        modelName: 'ScrewdriverAttribute',
        tableName: 'screwdriver_attributes',
        timestamps: true,
        underscored: true,
        createdAt: false,
        updatedAt: 'updated_at',
        indexes: [
            {
                fields: ['screwdriver_id', 'attribute_id', 'is_current']
            }
        ]
    });

    return ScrewdriverAttribute;
}; 