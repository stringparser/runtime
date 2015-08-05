'use strict';

exports = module.exports = {};

// dependencies
//
exports.type = require('utils-type');
exports.merge = require('lodash.merge');
exports.asyncDone = require('async-done');

// assortec
//
exports.map = function argsMap(argv, args, pos){
  var top = argv.length;
  var len = args.length;
  var index = 0;

  pos = Number(pos) || 0;

  while(pos < len){
    if(++index < top){
      argv[index] = args[pos++];
    } else {
      argv.push(args[pos++]);
    }
  }

  return argv;
};
