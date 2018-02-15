"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
// Standard regular expressions that can be reused throughout the codebase

exports.default = {
  captures: /<cap(\d{0,2})>/ig,
  delay: /{\s*delay\s*=\s*(\d+)\s*}/,
  filter: /\^(\w+)\(([^)]*)\)/i
};