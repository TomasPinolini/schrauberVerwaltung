const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ScrewdriverAttribute extends Model {
        static associate(models) {
            ScrewdriverAttribute.belongsTo(models.Screwdriver, {
                foreignKey: 'screwdriver_id',
                as: 'Screwdriver'
            });
            ScrewdriverAttribute.belongsTo(models.Attribute, {
                foreignKey: 'attribute_id',
                as: 'Attribute'
            });
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
        },
        state: {
            type: DataTypes.ENUM('on', 'off'),
            allowNull: false,
            defaultValue: 'on'
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'ScrewdriverAttribute',
        tableName: 'screwdriver_attributes',
        timestamps: false,
        underscored: true,
        indexes: [
            {
                fields: ['screwdriver_id', 'attribute_id', 'is_current']
            }
        ]
    });

    return ScrewdriverAttribute;
}; 