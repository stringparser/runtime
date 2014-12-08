'use strict';
/* global Runtime: true */
Runtime = require('../');

require('should');
var path = require('path');
var packageName = require('../package').name;


var util = require('./_util.js');

describe(packageName, function(){

  util.testSuite().forEach(function(file){
    var suite = path.basename(file, path.extname(file));
    describe(suite, function(){
      // the actual suite code
      require('./'+file);
    });
  });
});
