
var util = require('util');
var chalk = require('chalk');
var merge = require('utils-merge');

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
}

/*
 * doc holder
 */

exports.merge = merge;

/*
 * doc holder
 */

exports.quotify = function(str){
  return str.replace(/('|"|`)(\S+)('|"|`)/g, function($0,$1,$2,$3){
    return $1 + chalk.yellow($2) + $3;
  })
}

/*
 * Order the prototype by key length
 * just to be nicer to `console.log`s
 */

exports.prettyPrototype = function(obj){

  if(!obj.prototype) return;

  var unOrdered = obj.prototype;
  var ordered = {};

  Object.keys(obj.prototype).sort(function(key, next){
    return key.length-next.length;
  }).forEach(function(method){
    ordered[method] = unOrdered[method];
  });

  obj.prototype = ordered;
}
