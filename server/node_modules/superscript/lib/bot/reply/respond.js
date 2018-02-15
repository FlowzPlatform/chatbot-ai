'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _debugLevels = require('debug-levels');

var _debugLevels2 = _interopRequireDefault(_debugLevels);

var _common = require('./common');

var _common2 = _interopRequireDefault(_common);

var _getReply = require('../getReply');

var _getReply2 = _interopRequireDefault(_getReply);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const debug = (0, _debugLevels2.default)('SS:Reply:Respond');

const respond = (() => {
  var _ref = _asyncToGenerator(function* (topicName, options) {
    debug.verbose(`Responding to topic: ${topicName}`);

    const topicData = yield _common2.default.getTopic(options.system.chatSystem, topicName);

    options.pendingTopics = [topicData];

    const respondReply = yield new Promise(function (resolve, reject) {
      (0, _getReply2.default)(options.message, options, function (err, respondReply) {
        err ? reject(err) : resolve(respondReply);
      });
    });

    debug.verbose('Callback from respond getReply: ', respondReply);

    return respondReply || {};
  });

  function respond(_x, _x2) {
    return _ref.apply(this, arguments);
  }

  return respond;
})();

exports.default = respond;