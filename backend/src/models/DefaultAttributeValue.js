const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class DefaultAttributeValue extends Model {
        static associate(models) {
            DefaultAttributeValue.belongsTo(models.Attribute, {
                foreignKey: 'attribute_id',
                constraints: false
            });
        }
    }

    DefaultAttributeValue.init({
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
        modelName: 'DefaultAttributeValue',
        tableName: 'default_attribute_values',
        timestamps: true,
        underscored: true,
        paranoid: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at'
    });

    return DefaultAttributeValue;
}; 