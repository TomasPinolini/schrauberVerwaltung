const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Attribute = sequelize.define('Attribute', {
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
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Description of what this attribute represents'
        },
        default_value: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        format_data: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Regex pattern for validation'
        },
        is_required: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'If true, this attribute is required for all screwdrivers'
        },
        state: {
            type: DataTypes.ENUM('on', 'off'),
            allowNull: false,
            defaultValue: 'on'
        },
        screwdriver_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'screwdrivers',
                key: 'id'
            },
            comment: 'The screwdriver category this attribute belongs to'
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
        tableName: 'attributes',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return Attribute;
}; 