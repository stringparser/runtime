'use strict';

var runtime = require('./.');
var app = runtime.create('app');

process.hrtime = require('browser-process-hrtime');

window.require = require;
window.runtime = runtime;
