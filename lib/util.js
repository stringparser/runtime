/* jshint strict: false, browser: true */

var util = { };

exports = module.exports = util;

// dependencies
util.has = require('lodash.has');
util.type = require('utils-type');
util.merge = require('utils-merge');
util.clone = require('lodash.clone');
util.Manifold = require('manifold');
util.inherits = require('inherits');
util.asyncDone = require('async-done');
util.prettyTime = require('pretty-hrtime');

// library util
util.Stack = require('./stack');
util.completer = require('./completer');

// convert arguments to array
//
util.args = function (args, index){
  index = Number(index) || 0;
  var len = args.length;
  var argv = new Array(len - index);
  argv.length = 0;
  while(index < len){
    argv[argv.length++] = args[index++];
  }
  return argv;
};

// prevent property from being changed
//
util.defineFrozenProperty = function (obj, prop, value){
  Object.defineProperty(obj, prop, {
    value: value,
    writable: false,
    enumerable: true,
    configurable: false
  });
};
