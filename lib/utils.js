
/*
 * Module dependencies
 */

var util = require('util');

var is = exports.is = require('utils-type');
var args = exports.args = require('minimist');
var merge = exports.merge = require('utils-merge');
var Herror = exports.Error = require('herro').Herror;
var assert = exports.assert = require('better-assert');
var callsite = exports.callsite = require('callsite');

/*
 * doc holder
 */

exports = merge({}, util);

var boil = exports.boil = function boil(obj, regex){

  if( !obj )
    return [ ];

  var objIs = is(obj), str;

  if( objIs.string )
    str = obj;
  else if( objIs.array )
    str = obj.join(' ');
  else if( objIs.object && !objIs.types )
    str = Object.keys(obj).join(' ');
  else {
    return [ ];
  }

  return str.trim().split(regex || /[ ]+/);
};

/*
 * property formatted debug
 */

var debug = exports.debug = function(debugFn){

  var lebug = debugFn;
  return function(/* arguments */){
    if(process.env.DEBUG){
      var args = [].slice.call(arguments,1);
      args = args.map(function(elem){
        return util.inspect( elem, { colors : true });
      });

      args.unshift('', arguments[0]);
      lebug.apply(lebug, args);
    }
  };
};
