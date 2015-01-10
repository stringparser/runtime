'use strict';

var util = { };

exports = module.exports = util;

util.type = require('utils-type');
util.merge = require('utils-merge');
util.inherits = require('inherits');
util.clone = require('lodash.clone');
util.asyncDone = require('async-done');
util.prettyTime = require('pretty-hrtime');


util.boilFns = require('./boilFns');
util.boilArgs = require('./boilArgs');
