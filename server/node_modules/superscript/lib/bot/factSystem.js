'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _sfacts = require('sfacts');

var _sfacts2 = _interopRequireDefault(_sfacts);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const decorateFactSystem = function decorateFactSystem(factSystem) {
  const getFactSystem = function getFactSystem(tenantId = 'master') {
    return factSystem.createUserDB(`${tenantId}`);
  };

  return { getFactSystem };
};

const setupFactSystem = function setupFactSystem(mongoURI, { clean, importData }, callback) {
  // TODO: On a multitenanted system, importing data should not do anything
  if (importData) {
    return _sfacts2.default.load(mongoURI, importData, clean, (err, factSystem) => {
      callback(err, decorateFactSystem(factSystem));
    });
  }
  return _sfacts2.default.create(mongoURI, clean, (err, factSystem) => {
    callback(err, decorateFactSystem(factSystem));
  });
};

exports.default = {
  setupFactSystem
};