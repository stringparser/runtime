'use strict';

var util = require('./lib/util');
var Runtime = require('./lib/Runtime');

exports = module.exports = Runtime;

/**
 Missing docs
**/
exports.Stack = require('./lib/Stack');

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
