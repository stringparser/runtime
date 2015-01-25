/* jshint strict: false, browser: true */

var util = { };

exports = module.exports = util;

// dependencies
util.type = require('utils-type');
util.merge = require('utils-merge');
util.inherits = require('inherits');
util.clone = require('lodash.clone');
util.asyncDone = require('async-done');
util.prettyTime = require('pretty-hrtime');

// library util
util.args = require('./args');
