const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Attribute extends Model {
        static associate(models) {
            Attribute.belongsToMany(models.Screwdriver, {
                through: models.ScrewdriverAttribute,
                foreignKey: 'attribute_id',
                otherKey: 'screwdriver_id'
            });
        }
    }

    Attribute.init({
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
        validation_pattern: {
            type: DataTypes.STRING,
            allowNull: true
        },
        is_required: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        is_parent: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        unique: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
            field: 'unique'
        },
        state: {
            type: DataTypes.ENUM('on', 'off'),
            defaultValue: 'on'
        }
    }, {
        sequelize,
        modelName: 'Attribute',
        tableName: 'attributes',
        timestamps: true,
        paranoid: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        indexes: [
            {
                fields: ['state']
            },
            {
                fields: ['deleted_at']
            }
        ]
    });

    return Attribute;
}; 