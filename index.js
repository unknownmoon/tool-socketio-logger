const Logger = require('./lib/logger');
const argv = require('minimist')(process.argv.slice(2));

const logger = new Logger({
    port: argv.p || argv.port || 9528
});

logger.start();