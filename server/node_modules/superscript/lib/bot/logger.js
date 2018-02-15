'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Logger {
  constructor(logPath) {
    if (logPath) {
      try {
        _mkdirp2.default.sync(logPath);
        this.logPath = logPath;
      } catch (e) {
        console.error(`Could not create logs folder at ${logPath}: ${e}`);
      }
    }
  }

  log(message, logName = 'default') {
    if (this.logPath) {
      const filePath = `${this.logPath}/${logName}.log`;
      try {
        _fs2.default.appendFileSync(filePath, message);
      } catch (e) {
        console.error(`Could not write log to file with path: ${filePath}`);
      }
    }
  }
}

exports.default = Logger;