
var util = require('util');
var merge = require('utils-merge');
var callsite = require('callsite');
var assert = require('better-assert');

/*
 * doc holder
 */

exports = merge({}, util);

var isBoolean = exports.isBoolean = function(obj){
  return (
    obj === true || obj === false ||
    toString.call(obj) == '[object Boolean]'
  );
};

var isFunction = exports.isFunction = function (obj){
  return typeof obj === 'function';
};

var isObject = exports.isObject = function(obj){
  return !isFunction(obj) && !isArray(obj) && obj === Object(obj);
};

var isNumber = exports.isNumber = function(obj){
  return typeof obj === 'number';
};

var isString = exports.isString = function(obj){
  return typeof obj === 'string';
};

var isArray = exports.isArray = function(obj){
  return toString.call(obj) === '[object Array]';
};


var boil = exports.boil = function boil(obj, regex){

  if( !obj )
    return [];

  var string = isString(obj);
  var array = isArray(obj);
  var copy = obj;

  if( !string && !array )
    return [];

  if( string ){
    return copy.trim().split(regex || /[ ]+/);
  } else {

    var index = 0;
    while( isString(copy[index]) ){
      copy[index] = copy[index].trim();
      index++;
    }

    if(index === copy.length){
      return copy;
    } else {
      return [];
    }
  }
};

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
