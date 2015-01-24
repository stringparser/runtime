'use strict';

var util = { };

exports = module.exports = util;

// dependencies
util.type = require('utils-type');
util.merge = require('utils-merge');
util.clone = require('lodash.clone');
util.inherits = require('inherits');
util.asyncDone = require('async-done');
util.prettyTime = require('pretty-hrtime');

// library
util.args = require('./args');
util.callsNext = require('./callsNext');
