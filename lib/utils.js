
var util = require('util');
var merge = require('utils-merge');
var callsite = require('callsite');
var assert = require('better-assert');

/*
 * doc holder
 */

exports = merge({}, util);

/*
 * doc holder
 */

var isBoolean = exports.isBoolean = function(obj){
  return (
    obj === true || obj === false ||
    toString.call(obj) == '[object Boolean]'
  );
};

/*
 * doc holder
 */

var isFunction = exports.isFunction = function (obj){
  return typeof obj === 'function';
};

/*
 * doc holder
 */

var isObject = exports.isObject = function(obj){
  return !isArray(obj) && obj === Object(obj);
};

/*
 * doc holder
 */

var isNumber = exports.isNumber = function(obj){
  return typeof obj === 'number';
};

/*
 * doc holder
 */

var isString = exports.isString = function(obj){
  return typeof obj === 'string';
};

/*
 * doc holder
 */

var isArray = exports.isArray = function(obj){
  return Array.isArray(obj);
};

/*
 * doc holder
 */

var isArguments = exports.isArguments = function(obj){
  return obj.length && !isString(obj) && !isArray(obj);
};

/*
 * doc holder
 */

var isEmpty = exports.isEmpty = function(obj){

  if( obj === null   ) return true;
  if( obj === void 0 ) return true;

  var type = typeof obj;
  if( type === 'number'   || isBoolean(obj) ) return false;
  if( type === 'function' || type === 'string' || isArray(obj) || isArguments(obj) ) return obj.length === 0;

  for(var key in obj){
    if( hasOwnProperty.call(obj, key) ){
      return false;
    }
  }

  return true;
};

/*
 * doc holder
 */

var isFalsy = exports.isFalsy = function(obj){

  if( !isEmpty(obj) )
    return isBoolean(obj) && obj === false;

  return true;
};

/*
 * doc holder
 */

var isTruthy = exports.isTruthy = function(obj){

  return !isFalsy(obj);
};

/*
 * function `orderObject`
 * just to be nicer to `console.log`s
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

/*
 * doc holder
 */

var quotify = exports.quotify = function(str){
  return str.replace(/('|"|`)(\S+)('|"|`)/g, function($0,$1,$2,$3){
    return $1 + $2 + $3;
  });
};

exports = module.exports = orderObject(exports);
