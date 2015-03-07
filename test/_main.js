'use strict';

var pack = require('../');
var path = require('path');
var util = require('./_util.js');
var cage = require('../package.json');

process.chdir(path.join(__dirname));

describe(cage.name, function(){
  util.suite().forEach(function(file){
    var suite = path.basename(file, path.extname(file));
    describe(suite, function(){
      require('./'+file)(pack, util);
    });
  });
});
