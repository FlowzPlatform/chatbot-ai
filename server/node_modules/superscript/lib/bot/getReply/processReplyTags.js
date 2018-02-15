'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _debugLevels = require('debug-levels');

var _debugLevels2 = _interopRequireDefault(_debugLevels);

var _processTags = require('../processTags');

var _processTags2 = _interopRequireDefault(_processTags);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const debug = (0, _debugLevels2.default)('SS:GetReply:ProcessTags');

const processReplyTags = (() => {
  var _ref = _asyncToGenerator(function* (reply, options) {
    let replyObj;
    try {
      replyObj = yield _processTags2.default.processReplyTags(reply, options);
    } catch (err) {
      debug.verbose('There was an error in processTags: ', err);
    }

    if (!_lodash2.default.isEmpty(replyObj)) {
      // reply is the selected reply object that we created earlier (wrapped mongoDB reply)
      // reply.reply is the actual mongoDB reply object
      // reply.reply.reply is the reply string
      replyObj.matched_reply_string = reply.reply.reply;
      replyObj.matched_topic_string = reply.topic;

      debug.verbose('Reply object after processing tags: ', replyObj);

      return replyObj;
    }

    debug.verbose('No reply object was received from processTags so check for more.');
    return null;
  });

  function processReplyTags(_x, _x2) {
    return _ref.apply(this, arguments);
  }

  return processReplyTags;
})();

exports.default = processReplyTags;