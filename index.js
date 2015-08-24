'use strict';

var util = require('./lib/util');
var Stack = require('./lib/Stack');
var Runtime = require('./lib/Runtime');

exports = module.exports = Runtime;

/**
 Missing docs
**/
exports.Stack = Stack;
exports.Stack.createClass = util.classFactory(Stack);

/**
 Missing docs
**/
exports.create = function create(props){
  return new Runtime(props);
};

/**
 Missing docs
**/
exports.createClass = util.classFactory(Runtime);
