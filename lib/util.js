'use strict';

var _slice = Array.prototype.slice;

exports = module.exports = {};

// dependencies
//
exports.type = require('utils-type');
exports.merge = require('lodash.merge');
exports.inherits = require('inherits');
exports.asyncDone = require('async-done');

exports.slice = function slice(args, index, top){
  return _slice.call(args, index, top);
};
