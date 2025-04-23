const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Screwdriver extends Model {
        static associate(models) {
            Screwdriver.belongsToMany(models.Attribute, {
                through: models.ScrewdriverAttribute,
                foreignKey: 'screwdriver_id',
                otherKey: 'attribute_id'
            });
        }
    }

    Screwdriver.init({
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
            allowNull: false,
            defaultValue: 'on'
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'Screwdriver',
        tableName: 'screwdrivers',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                fields: ['state']
            }
        ]
    });

    return Screwdriver;
}; 