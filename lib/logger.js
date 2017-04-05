'use strict';

const winston = require('winston');

let winstonConfig = {
    level: 'debug',
    transports: [
        new (winston.transports.Console)({
            timestamp: true,
            colorize: true
        })
    ]
}

const logger = new winston.Logger(winstonConfig);

module.exports = logger;
