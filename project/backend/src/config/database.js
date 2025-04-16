const { Sequelize } = require('sequelize');
require('dotenv').config();

module.exports = {
    dialect: 'mysql',
    host: 'localhost',
    username: 'root',
    password: '',
    database: 'schrauber_verwaltung',
    logging: false,
    define: {
        timestamps: true,
        underscored: true
    }
}; 