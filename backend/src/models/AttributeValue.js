const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AttributeValue extends Model {
        static associate(models) {
            AttributeValue.belongsTo(models.Attribute, {
                foreignKey: 'attribute_id',
                as: 'Attribute'
            });
        }
    }

    AttributeValue.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
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
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        state: {
            type: DataTypes.ENUM('on', 'off'),
            defaultValue: 'on'
        }
    }, {
        sequelize,
        modelName: 'AttributeValue',
        tableName: 'attribute_values',
        timestamps: true,
        paranoid: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        indexes: [
            {
                fields: ['attribute_id']
            },
            {
                fields: ['state']
            },
            {
                fields: ['deleted_at']
            }
        ]
    });

    return AttributeValue;
}; 