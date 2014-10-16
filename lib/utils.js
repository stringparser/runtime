'use strict';

var util = require('util');

exports = module.exports = { };

exports.merge = function(target, source){
  if(target && source){
    for(var key in source){
      target[key] = source[key];
    }
  }
  return target;
};

// core utils copy
var copy = exports.merge({ }, {
  inspect : util.inspect,
  inherits : util.inherits
});
exports.merge(exports, copy);

// type checking
exports.which = require('which');
exports.argv = require('minimist');
exports.type = require('utils-type');
exports.debug = require('utils-debug');
exports.Error = require('herro').Herror;

exports.boil = function (obj, regex){
  if( !obj ){ return [ ]; }
  var objIs = exports.type(obj);
  if( objIs.string ){
    return obj.trim().split(regex || /[ ]+/);
  }
  if( objIs.array ){
    return obj.filter(function(elem){
      return exports.type(elem).string;
    });
  }
  return [ ];
};
exports.requirem = require('requirem');
