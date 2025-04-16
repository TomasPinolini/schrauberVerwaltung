const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Screwdriver = sequelize.define('Screwdriver', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        parent_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'screwdrivers',
                key: 'id'
            }
        },
        type: {
            type: DataTypes.ENUM('category', 'instance'),
            allowNull: false,
            defaultValue: 'category',
            comment: 'Determines if this is a category or an actual screwdriver instance'
        },
        state: {
            type: DataTypes.ENUM('on', 'off'),
            allowNull: false,
            defaultValue: 'on'
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'screwdrivers',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return Screwdriver;
}; 