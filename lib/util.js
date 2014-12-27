'use strict';

var utils = require('util');
var util = { };

exports = module.exports = util;

// core utils copy
var copy = util.merge({ }, {
  inspect : utils.inspect,
  inherits : utils.inherits
});
util.merge(exports, copy);

util.args = function (Args, index){
  index = index || 0;
  var len = Args.length;
  var args = new Array(len); args.length = 0;
  while(index < len){ args[args.length++] = Args[index++]; }
  return args;
};

util.type = require('utils-type');
util.through = require('through2');
util.merge = require('lodash.merge');
util.clone = require('lodash.clone');
util.prettyTime = require('pretty-hrtime');
