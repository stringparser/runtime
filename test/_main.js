'use strict';

var path = require('path');
var packageName = require('../package').name;
var pack = require('../');

var util = require('./_util.js');

describe(packageName, function(){

  util.testSuite().forEach(function(file){
    var suite = path.basename(file, path.extname(file));
    describe(suite, function(){
      // the actual suite code
      require('./'+file)(pack, util);
    });
  });
});
