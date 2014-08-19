
var util = require('util');
var merge = require('utils-merge');
var callsite = require('callsite');
var assert = require('better-assert');

/*
 * doc holder
 */

exports = module.exports = merge({}, util);

/*
 * doc holder
 */

exports.isUndefined = util.isUndefined || function(obj){
  return obj === void 0;
};

/*
 * doc holder
 */

exports.isObject = util.isObject || function(obj){
  return !Array.isArray(obj) && obj === Object(obj);
};

/*
 * doc holder
 */

exports.isBoolean = function(obj){

  return (
      obj === true || obj === false ||
      toString.call(obj) == '[object Boolean]'
  );

};

/*
 * doc holder
 */

exports.isString = function(obj){
  return typeof obj === 'string';
};

/*
 * doc holder
 */

exports.isFunction = function(obj){
  return typeof obj === 'function';
};

/*
 * jessetane's merge
 */

exports.merge = merge;

/*
 * TJ's callsite
 */

exports.callsite = callsite;

/*
 * TJ's better-assert
 */

exports.assert = assert;

/*
 * doc holder
 */

exports.quotify = function(str){
  return str.replace(/('|"|`)(\S+)('|"|`)/g, function($0,$1,$2,$3){
    return $1 + $2 + $3;
  });
};

/*
 * Order the object properties by key length
 * just to be nicer to `console.log`s
 */

exports.orderObject = function(obj){

  if(!obj) return;

  var unOrdered = obj;
  var ordered = {};

  Object.keys(obj).sort(function(key, next){
    return key.length-next.length;
  }).forEach(function(method){
    ordered[method] = unOrdered[method];
  });

  obj = ordered;
};
