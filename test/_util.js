
'use strict';

require('should');
var fs = require('fs');

module.exports = {
  suite : function testFiles(){
    var suite = fs.readdirSync(__dirname);
    // priority
    var first = [
      'stack.js',
      'state.js',
      'repl.js',
      'integration.js'
    ];

    // take out
    var exclude = [
      '_main.js',
      '_util.js',
      'dir'
    ];

    // files starting with _ and without extension _main & _util files
    first.concat(exclude).forEach(function(file){
      suite.splice(suite.indexOf(file), 1);
    });

    suite.unshift.apply(suite, first);
    return suite;
  },
  gulp: require('gulp'),
  mkdirp: require('mkdirp'),
  rimraf: require('rimraf'),
  through: require('through2')
};
