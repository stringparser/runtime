'use strict';

exports = module.exports = {};

// dependencies
//
exports.type = require('utils-type');
exports.merge = require('lodash.merge');
exports.inherits = require('inherits');
exports.asyncDone = require('async-done');

// library deps
//
exports.args = require('./args');

// assorted
//

exports.stringID = function stringID(){
  return Math.random().toString(36).slice(2);
};
