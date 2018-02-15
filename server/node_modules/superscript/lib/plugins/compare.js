'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _utils = require('../bot/utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = (0, _debug2.default)('Compare Plugin');

const createFact = function createFact(s, v, o, cb) {
  this.user.memory.create(s, v, o, false, () => {
    this.facts.db.get({ subject: v, predicate: 'opposite' }, (e, r) => {
      if (r.length !== 0) {
        this.user.memory.create(o, r[0].object, s, false, () => {
          cb(null, '');
        });
      } else {
        cb(null, '');
      }
    });
  });
};

exports.default = {
  createFact
};