
'use strict';

var fs = require('fs');

module.exports = {
  testSuite : function(){
    var testSuite = fs.readdirSync(__dirname);
    // in case there is priority
    var testFirst = [
      'stems.js',
      'stack.js',
      'state.js',
      'resolve.js'
    ];
    var exclude = [
      '_main.js',
      '_util.js',
      'dir'
    ];

    // use it also to omit _main & _util files
    testFirst.concat(exclude).forEach(function(file){
      testSuite.splice(testSuite.indexOf(file), 1);
    });
    testSuite.unshift.apply(testSuite, testFirst);
    return testSuite;
  }
};
