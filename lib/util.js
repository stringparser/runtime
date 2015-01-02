'use strict';

var util = { };
var utils = require('util');
var prettyTime = require('pretty-hrtime');

exports = module.exports = util;

util.type = require('utils-type');
util.through = require('through2');
util.merge = require('utils-merge');
util.clone = require('lodash.clone');
util.nextTick = require('next-tick');
util.prettyTime = function(time){
  return prettyTime(time, {precise: true});
};


util.args = function (Args, index){
  index = index || 0;
  var len = Args.length;
  var args = new Array(len - index); args.length = 0;
  while(index < len){ args[args.length++] = Args[index++]; }
  return args;
};

// core utils copy
var copy = util.merge({ }, {
  inspect : utils.inspect,
  inherits : utils.inherits
});
util.merge(exports, copy);
