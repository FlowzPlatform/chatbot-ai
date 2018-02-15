'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
const addMessageProp = function addMessageProp(key, value, callback) {
  if (key !== '' && value !== '') {
    return callback(null, { [key]: value });
  }

  return callback(null, '');
};

const hasTag = function hasTag(tag, callback) {
  if (this.message.tags.indexOf(tag) !== -1) {
    return callback(null, true);
  }
  return callback(null, false);
};

exports.default = { addMessageProp, hasTag };