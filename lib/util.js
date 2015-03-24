'use strict';

var util = { };

exports = module.exports = util;

// dependencies
util.type = require('utils-type');
util.Manifold = require('manifold');
util.inherits = require('inherits');
util.asyncDone = require('async-done');
util.prettyTime = require('pretty-hrtime');

// library util
util.args = require('./args');
util.hrtime = require('./hrtime');
util.completer = require('./completer');

// prevent property from being changed
//
util.defineFrozenProp = function (obj, prop, value){
  Object.defineProperty(obj, prop, {
    value: value,
    writable: false,
    enumerable: true,
    configurable: false
  });
};
