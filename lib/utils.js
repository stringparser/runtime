
/*
 * Module dependencies
 */

var util = require('util');

var is = require('utils-type');
var merge = require('utils-merge');
var callsite = require('callsite');
var assert = require('better-assert');

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

/*
 * function `orderObject`
 * be nice to `console.log`s
 */

var orderObject = exports.orderObject = function(obj){

  if(!isObject(obj)) return;

  var unOrdered = obj;
  var ordered = {};

  Object.getOwnPropertyNames(obj).sort().forEach(function(method){
    ordered[method] = unOrdered[method];
  });

  return ordered;
};

/*
 * jessetane's merge
 */

var merge = exports.merge = merge;

/*
 * TJ's callsite
 */

var callsite = exports.callsite = callsite;

/*
 * TJ's better-assert
 */

var assert = exports.assert = assert;


exports = module.exports = orderObject(exports);
