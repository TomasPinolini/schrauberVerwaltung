const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'schrauber-verwaltung' },
    transports: [
        // Write all logs to console
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(
                    info => `${info.timestamp} ${info.level}: ${info.message}`
                )
            )
        }),
        // Write all logs with level 'error' and below to 'error.log'
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/error.log'),
            level: 'error'
        }),
        // Write all logs with level 'info' and below to 'combined.log'
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/combined.log')
        })
    ]
});

// Create a stream object with a 'write' function that will be used by morgan
logger.stream = {
    write: function(message) {
        logger.info(message.trim());
    }
};

module.exports = logger; 