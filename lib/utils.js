
/*
 * Module dependencies
 */

var util = require('util');
var merge = require('utils-merge');

exports = module.exports = merge({ }, util);
exports.merge = merge;

var is = exports.type = require('utils-type');
var args = exports.args = require('minimist');
var Herror = exports.Error = require('herro').Herror;
var assert = exports.assert = require('better-assert');
var callsite = exports.callsite = require('callsite');

/*
 * doc holder
 */

var boil = exports.boil = function boil(obj, regex){

  if( !obj )
    return [ ];

  var objIs = is(obj), str;

  if( objIs.string )
    str = obj;
  else if( objIs.array )
    return obj.filter(function(elem){
      return is(elem).string;
    });
  else if( objIs.object && !objIs.types )
    str = Object.keys(obj).join(' ');
  else {
    return [ ];
  }

  return str.trim().split(regex || /[ ]+/);
};
