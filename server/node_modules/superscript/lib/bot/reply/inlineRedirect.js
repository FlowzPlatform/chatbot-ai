'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _debugLevels = require('debug-levels');

var _debugLevels2 = _interopRequireDefault(_debugLevels);

var _ssMessage = require('ss-message');

var _ssMessage2 = _interopRequireDefault(_ssMessage);

var _common = require('./common');

var _common2 = _interopRequireDefault(_common);

var _getReply = require('../getReply');

var _getReply2 = _interopRequireDefault(_getReply);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const debug = (0, _debugLevels2.default)('SS:Reply:inline');

const inlineRedirect = (() => {
  var _ref = _asyncToGenerator(function* (triggerTarget, options) {
    debug.verbose(`Inline redirection to: '${triggerTarget}'`);

    // if we have a special topic, reset it to the previous one
    // in order to preserve the context for inline redirection
    if (options.topic === '__pre__' || options.topic === '__post__') {
      if (options.user.history.length !== 0) {
        options.topic = options.user.history[0].topic;
      }
    }

    let topicData;
    try {
      topicData = yield _common2.default.getTopic(options.system.chatSystem, options.topic);
    } catch (err) {
      console.error(err);
      return {};
    }

    const messageOptions = {
      factSystem: options.system.factSystem
    };

    const redirectMessage = yield new Promise(function (resolve, reject) {
      _ssMessage2.default.createMessage(triggerTarget, messageOptions, function (err, redirectMessage) {
        err ? reject(err) : resolve(redirectMessage);
      });
    });

    options.pendingTopics = [topicData];

    const redirectReply = yield new Promise(function (resolve, reject) {
      (0, _getReply2.default)(redirectMessage, options, function (err, redirectReply) {
        err ? reject(err) : resolve(redirectReply);
      });
    });

    debug.verbose('Response from inlineRedirect: ', redirectReply);
    return redirectReply || {};
  });

  function inlineRedirect(_x, _x2) {
    return _ref.apply(this, arguments);
  }

  return inlineRedirect;
})();

exports.default = inlineRedirect;