'use strict';

var utils = require('util');
var util = { };

exports = module.exports = util;

util.type = require('utils-type');
util.through = require('through2');
util.clone = require('lodash.clone');
util.prettyTime = require('pretty-hrtime');

util.merge = function(target, source){
  if(target && source){
    for(var key in source){
      target[key] = source[key];
    }
  }
  return target;
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
