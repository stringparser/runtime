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

exports.which = require('which');
exports.argv = require('minimist');
exports.type = require('utils-type');
exports.through = require('through2');
exports.debug = require('utils-debug');
exports.requirem = require('requirem');
exports.findup = require('findup-sync');
exports.Error = require('herro').Herror;
exports.camelcase = require('camelcase');

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
