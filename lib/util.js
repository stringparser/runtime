'use strict';

exports = module.exports = {};

// dependencies
//
exports.type = require('utils-type');
exports.merge = require('lodash.merge');
exports.inherits = require('inherits');
exports.asyncDone = require('async-done');

// assorted
//

exports.stringID = function stringID(){
  return Math.random().toString(36).slice(2);
};

exports.map = function argsMap(argv, args, pos){
  var len = args.length;
  if(!len){ return; }

  var top = argv.length;
  pos = (pos || 1) - 1;

  var index = 0;
  while(++pos < len){
    if(pos < top){
      argv[++index] = args[pos];
    } else {
      argv.push(args[pos]);
    }
  }
};
