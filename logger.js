// log4js設定
var log4js = require('log4js');
log4js.configure({
    appenders: {
      logFile: { type: 'file', filename: './log/operation.log' },
      out: { type: 'stdout'},
    },
    categories: {
      //default: { appenders: [ 'logFile' ], level: 'error' }
      default: { appenders: [ 'out' ], level: 'trace' },
      errLog: { appenders: ['logFile'], level: 'info'}
    }
  });
const logger = log4js.getLogger();
logger.level = 'all';

module.exports = {logger};