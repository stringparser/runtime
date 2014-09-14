'use strict';

/*
 * Module dependencies
 */

var util = require('util');
var merge = require('utils-merge');

exports = module.exports = merge({ }, util);
exports.merge = merge;

exports.type = require('utils-type');
exports.args = require('minimist');
exports.Error = require('herro').Herror;
exports.callsite = require('callsite');

/*
 * doc holder
 */

exports.boil = function boil(obj, regex){

  if( !obj ){
    return [ ];
  }

  var objIs = exports.type(obj);

  if( objIs.string ){
    return obj.trim().split(regex || /[ ]+/);
  } else if( objIs.array ){
    return obj.filter(function(elem){
      return exports.type(elem).string;
    });
  } else {
    return [ ];
  }
};
