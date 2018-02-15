'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _debugLevels = require('debug-levels');

var _debugLevels2 = _interopRequireDefault(_debugLevels);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const debug = (0, _debugLevels2.default)('SS:ProcessHelpers');

const getTopic = (() => {
  var _ref = _asyncToGenerator(function* (chatSystem, name) {
    if (!name) {
      // TODO: This should probably throw, not return null
      return null;
    }

    debug.verbose('Getting topic data for', name);
    const topicData = yield chatSystem.Topic.findOne({ name }).lean().exec();

    if (!topicData) {
      throw new Error(`No topic found for the topic name "${name}"`);
    } else {
      return { id: topicData._id, name, type: 'TOPIC' };
    }
  });

  function getTopic(_x, _x2) {
    return _ref.apply(this, arguments);
  }

  return getTopic;
})();

exports.default = {
  getTopic
};