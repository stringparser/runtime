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

exports.mapFrom = function mapFrom(argv, args, pos){
  if(!args.length){ return; }

  pos = (Number(pos) || 0) - 1;
  var top = argv.length;
  var len = args.length;

  var index = -1;
  while(++pos < len){
    if(++index < top){
      argv[index] = args[pos];
    } else {
      argv.push(args[pos]);
    }
  }
};
