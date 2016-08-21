'use strict';

var util = require('./lib/util');
var Stack = require('./lib/Stack');
var Runtime = require('./lib/Runtime');

exports = module.exports = util.createClass(Runtime, {
  statics: {
    Stack: Stack
  }
});
