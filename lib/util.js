'use strict';

var _slice = Array.prototype.slice;

exports = module.exports = {};

// dependencies
//
exports.type = require('utils-type');
exports.merge = require('lodash.merge');
exports.inherits = require('inherits');
exports.asyncDone = require('async-done');

// assorted
//

exports.mapFrom = function mapFrom(u, v, pos){
  if(!v.length){ return u; }

  pos = (Number(pos) || 0) - 1;
  var top = u.length;
  var len = v.length;
  var index = -1;

  while(++pos < len){
    if(++index < top){
      u[index] = v[pos];
    } else {
      u.push(v[pos]);
    }
  }

  return u;
};

exports.slice = function slice(args, index, top){
  return _slice.call(args, index, top);
};

exports.stringID = function stringID(){
  return Math.random().toString(36).slice(2);
};
