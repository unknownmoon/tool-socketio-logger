const Logger = require('./lib/logger');

const logger = new Logger({
    port: 9528
});

logger.start();