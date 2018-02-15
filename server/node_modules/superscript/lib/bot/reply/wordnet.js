'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _wordpos = require('wordpos');

var _wordpos2 = _interopRequireDefault(_wordpos);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; } // This is a shim for wordnet lookup.
// http://wordnet.princeton.edu/wordnet/man/wninput.5WN.html

const wordpos = new _wordpos2.default();

// Unhandled promises should throw top-level errors, not just silently fail
process.on('unhandledRejection', err => {
  throw err;
});

const define = (() => {
  var _ref = _asyncToGenerator(function* (word) {
    const results = yield wordpos.lookup(word);
    if (_lodash2.default.isEmpty(results)) {
      throw new Error(`No results for wordnet definition of '${word}'`);
    }

    return results[0].def;
  });

  function define(_x) {
    return _ref.apply(this, arguments);
  }

  return define;
})();

// Does a word lookup
// @word can be a word or a word/pos to filter out unwanted types
const lookup = (() => {
  var _ref2 = _asyncToGenerator(function* (word, pointerSymbol = '~') {
    let pos = null;

    const match = word.match(/~(\w)$/);
    if (match) {
      pos = match[1];
      word = word.replace(match[0], '');
    }

    const synets = [];

    const results = yield wordpos.lookup(word);
    results.forEach(function (result) {
      result.ptrs.forEach(function (part) {
        if (pos !== null && part.pos === pos && part.pointerSymbol === pointerSymbol) {
          synets.push(part);
        } else if (pos === null && part.pointerSymbol === pointerSymbol) {
          synets.push(part);
        }
      });
    });

    let items = yield Promise.all(synets.map((() => {
      var _ref3 = _asyncToGenerator(function* (word) {
        const sub = yield wordpos.seek(word.synsetOffset, word.pos);
        return sub.lemma;
      });

      return function (_x3) {
        return _ref3.apply(this, arguments);
      };
    })()));

    items = _lodash2.default.uniq(items);
    items = items.map(function (x) {
      return x.replace(/_/g, ' ');
    });
    return items;
  });

  function lookup(_x2) {
    return _ref2.apply(this, arguments);
  }

  return lookup;
})();

// Used to explore a word or concept
// Spits out lots of info on the word
const explore = (() => {
  var _ref4 = _asyncToGenerator(function* (word, cb) {
    let ptrs = [];

    const results = yield wordpos.lookup(word);
    for (let i = 0; i < results.length; i++) {
      ptrs.push(results[i].ptrs);
    }

    ptrs = _lodash2.default.uniq(_lodash2.default.flatten(ptrs));
    ptrs = _lodash2.default.map(ptrs, function (item) {
      return { pos: item.pos, sym: item.pointerSymbol };
    });

    ptrs = _lodash2.default.chain(ptrs).groupBy('pos').map(function (value, key) {
      return {
        pos: key,
        ptr: _lodash2.default.uniq(_lodash2.default.map(value, 'sym'))
      };
    }).value();

    return Promise.all(ptrs.map((() => {
      var _ref5 = _asyncToGenerator(function* (item) {
        return Promise.all(item.ptr.map((() => {
          var _ref6 = _asyncToGenerator(function* (ptr) {
            const res = yield lookup(`${word}~${item.pos}`, ptr);
            console.log(word, item.pos, ':', ptr, res.join(', '));
          });

          return function (_x7) {
            return _ref6.apply(this, arguments);
          };
        })()));
      });

      return function (_x6) {
        return _ref5.apply(this, arguments);
      };
    })()));
  });

  function explore(_x4, _x5) {
    return _ref4.apply(this, arguments);
  }

  return explore;
})();

exports.default = {
  define,
  explore,
  lookup
};