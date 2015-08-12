'use strict';

var util = require('./lib/util');
var Runtime = require('./lib/Runtime');

/*
 Missing docs
*/
exports = module.exports = Runtime;

/*
 Missing docs
*/
exports.create = function create(props){
  return new Runtime(props);
};

/*
 Missing docs
*/
exports.extend = exports.createClass = function createClass(mixin){
  function RuntimeConstructor(props){
    if(!(this instanceof RuntimeConstructor)){
      return new Runtime(props);
    }
    Runtime.apply(this, arguments);
  }
  util.inherits(RuntimeConstructor, Runtime);
  util.merge(RuntimeConstructor.prototype, util.type(mixin).plainObject);
  return RuntimeConstructor;
};
