'use strict';
/* jshint browser: true */

var util = { };

exports = module.exports = util;

var env = (function(){
  if(window){ return 'browser'; } else
  if(process){ return 'node'; }
});

// dependencies
util.type = require('utils-type');
util.merge = require('utils-merge');
util.clone = require('lodash.clone');
util.inherits = require('inherits');
util.asyncDone = require('async-done');
util.prettyTime = require('pretty-hrtime');
util.hrtime = (function(/* arguments */){
  if(env === 'browser'){
    return require('browser-process-hrtime');
  } else if(env === 'node'){
    return process.hrtime;
  }
})();

// library
util.args = require('./args');
