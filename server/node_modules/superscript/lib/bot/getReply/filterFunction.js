'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _debugLevels = require('debug-levels');

var _debugLevels2 = _interopRequireDefault(_debugLevels);

var _processTags = require('../processTags');

var _processTags2 = _interopRequireDefault(_processTags);

var _utils = require('../utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const debug = (0, _debugLevels2.default)('SS:FilterFunction');

const filterRepliesByFunction = (() => {
  var _ref = _asyncToGenerator(function* (potentialReplies, options) {
    const bits = yield Promise.all(potentialReplies.map((() => {
      var _ref2 = _asyncToGenerator(function* (potentialReply) {
        const system = options.system;

        // We support a single filter function in the reply
        // It returns true/false to aid in the selection.

        if (potentialReply.reply.filter) {
          const stars = { stars: potentialReply.stars };
          const cleanFilter = yield _processTags2.default.preprocess(potentialReply.reply.filter, stars, options);

          debug.verbose(`Reply filter function found: ${cleanFilter}`);

          const filterScope = _lodash2.default.merge({}, system.scope);
          filterScope.user = options.user;
          filterScope.message = options.message;
          filterScope.message_props = options.system.extraScope;

          try {
            var _ref3 = yield _utils2.default.runPluginFunc(cleanFilter, filterScope, system.plugins),
                _ref4 = _slicedToArray(_ref3, 1);

            const filterReply = _ref4[0];

            if (filterReply === 'true' || filterReply === true) {
              return true;
            }
            return false;
          } catch (err) {
            console.error(err);
            return false;
          }
        }

        return true;
      });

      return function (_x3) {
        return _ref2.apply(this, arguments);
      };
    })()));

    potentialReplies = potentialReplies.filter(function () {
      return bits.shift();
    });

    return potentialReplies;
  });

  function filterRepliesByFunction(_x, _x2) {
    return _ref.apply(this, arguments);
  }

  return filterRepliesByFunction;
})();

exports.default = filterRepliesByFunction;