'use strict';

var util = { };

exports = module.exports = util;

// dependencies
util.has = require('lodash.has');
util.type = require('utils-type');
util.merge = require('utils-merge');
util.clone = require('lodash.clone');
util.Manifold = require('manifold');
util.inherits = require('inherits');
util.asyncDone = require('async-done');
util.prettyTime = require('pretty-hrtime');

// library util
util.args = require('./args');
util.Stack = require('./stack');
util.completer = require('./completer');

// prevent property from being changed
//
util.defineFrozenProp = function (obj, prop, value){
  Object.defineProperty(obj, prop, {
    value: value || obj[prop],
    writable: false,
    enumerable: true,
    configurable: false
  });
};
