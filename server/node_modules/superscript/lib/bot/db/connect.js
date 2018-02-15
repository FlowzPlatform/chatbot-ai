'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_mongoose2.default.Promise = global.Promise;

exports.default = mongoURI => {
  const db = _mongoose2.default.createConnection(`${mongoURI}`);

  db.on('error', console.error);

  // If you want to debug mongoose
  // mongoose.set('debug', true);

  return db;
};