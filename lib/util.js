'use strict';

exports = module.exports = {};

// dependencies
//
exports.once = require('once');
exports.type = require('utils-type');
exports.clone = require('lodash.clone');
exports.merge = require('lodash.merge');
exports.inherits = require('inherits');
exports.asyncDone = require('async-done');
exports.createClass = require('createClass');

// assorted util
//

exports.mapFrom = function (argv, args, pos) {
  var index = -1;
  var length = args.length;

  while (++pos < length) {
    argv[++index] = args[pos];
  }
};
