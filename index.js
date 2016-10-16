#!/usr/bin/env node

const Logger = require('./lib/logger');
const _u = require('./lib/util');
const argv = _u.GLOBAL.argv;

const logger = new Logger({
    port: argv.p || argv.port || 9528
});

logger.start();