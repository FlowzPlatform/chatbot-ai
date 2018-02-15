'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _debugLevels = require('debug-levels');

var _debugLevels2 = _interopRequireDefault(_debugLevels);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const debug = (0, _debugLevels2.default)('SS:Reply:customFunction');

const customFunction = (() => {
  var _ref = _asyncToGenerator(function* (functionName, functionArgs, replyObj, options) {
    const plugins = options.system.plugins;
    // Important to create a new scope object otherwise we could leak data
    const scope = _lodash2.default.merge({}, options.system.scope);
    scope.extraScope = options.system.extraScope;
    scope.message = options.message;
    scope.user = options.user;

    if (!plugins[functionName]) {
      // If a function is missing, we kill the line and return empty handed
      throw new Error(`WARNING: Custom function (${functionName}) was not found. Your script may not behave as expected.`);
    }

    return new Promise(function (resolve, reject) {
      functionArgs.push(function (err, functionResponse, stopMatching) {
        let reply = '';
        const props = {};
        if (err) {
          console.error(`Error in plugin function (${functionName}): ${err}`);
          return reject(err);
        }

        if (_lodash2.default.isPlainObject(functionResponse)) {
          if (functionResponse.text) {
            reply = functionResponse.text;
            delete functionResponse.text;
          }

          if (functionResponse.reply) {
            reply = functionResponse.reply;
            delete functionResponse.reply;
          }

          // There may be data, so merge it with the reply object
          replyObj.props = _lodash2.default.merge(replyObj.props, functionResponse);
          if (stopMatching !== undefined) {
            replyObj.continueMatching = !stopMatching;
          }
        } else {
          reply = functionResponse || '';
          if (stopMatching !== undefined) {
            replyObj.continueMatching = !stopMatching;
          }
        }

        return resolve(reply);
      });

      debug.verbose(`Calling plugin function: ${functionName}`);
      plugins[functionName].apply(scope, functionArgs);
    });
  });

  function customFunction(_x, _x2, _x3, _x4) {
    return _ref.apply(this, arguments);
  }

  return customFunction;
})();

exports.default = customFunction;