/* jshint strict: false, browser: true */

var util = { };

exports = module.exports = util;

// dependencies
util.type = require('utils-type');
util.merge = require('utils-merge');
util.clone = require('lodash.clone');
util.inherits = require('inherits');
util.asyncDone = require('async-done');
util.prettyTime = require('pretty-hrtime');

// library util
util.args = function argsUtil(args, index){
  index = Number(index) || 0;

  var len = args.length;
  var argv = new Array(len - index);

  argv.length = 0;
  while(index < len){
    argv[argv.length++] = args[index++];
  }

  return argv;
};
