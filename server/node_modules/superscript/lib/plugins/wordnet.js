'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _wordnet = require('../bot/reply/wordnet');

var _wordnet2 = _interopRequireDefault(_wordnet);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const wordnetDefine = function wordnetDefine(cb) {
  const args = Array.prototype.slice.call(arguments);
  let word;

  if (args.length === 2) {
    word = args[0];
  } else {
    word = this.message.words.pop();
  }

  _wordnet2.default.define(word).then(result => {
    cb(null, `The Definition of ${word} is ${result}`);
  }).catch(() => {
    cb(null, `There is no definition for the word ${word}!`);
  });
};

exports.default = { wordnetDefine };