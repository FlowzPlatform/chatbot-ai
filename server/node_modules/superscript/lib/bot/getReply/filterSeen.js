'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _debugLevels = require('debug-levels');

var _debugLevels2 = _interopRequireDefault(_debugLevels);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const debug = (0, _debugLevels2.default)('SS:FilterSeen');

// This may be called several times, once for each topic.
const filterRepliesBySeen = (() => {
  var _ref = _asyncToGenerator(function* (filteredResults, options) {
    debug.verbose('filterRepliesBySeen', filteredResults);

    const bucket = filteredResults.map(function (filteredResult) {
      const replyId = filteredResult.reply._id;
      if (!filteredResult.seenCount) {
        filteredResult.seenCount = 0;
      }
      options.user.history.map(function (historyItem) {
        if (historyItem.topic !== undefined) {
          const pastGambit = historyItem.reply;
          const pastInput = historyItem.input;

          if (pastGambit && pastInput) {
            if (pastGambit.replyIds && pastGambit.replyIds.find(function (id) {
              return String(id) === String(replyId);
            })) {
              debug.verbose('Already Seen', filteredResult.reply);
              filteredResult.seenCount += 1;
            }
          }
        }
      });
      return filteredResult;
    });
    return bucket;
  });

  function filterRepliesBySeen(_x, _x2) {
    return _ref.apply(this, arguments);
  }

  return filterRepliesBySeen;
})();

exports.default = filterRepliesBySeen;