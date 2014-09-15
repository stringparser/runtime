'use strict';

var runtime = {};

;['Command'].forEach(function(testName){

  /*
   * Sample instance
   * --
   * Each test gets its separate instance
   */

  runtime[testName] = require('../.').create(testName);

  runtime[testName]
    .set(function rootNodeHandle(){});

  runtime[testName]
    .set('1', function one(){ })
    .set('2', function two(){ })
    .set('3', function three(){ });

  runtime[testName]
    .set('1-nest')
    .set('1-nest 2-nest 3-nest', function threeNest(){ });

  runtime[testName]
    .set('--flag', function rootNodeFlag(){});

  runtime[testName]
    .set('1-nest --flag', function oneNestFlag(){});

  runtime[testName]
    .set(['1-alias', '2-alias --flag', '3-alias'],
      function oneAliased(){ return this; }
    );

  describe('runtime.'+testName, function(){

    var fs = require('fs');
    var testFiles = fs.readdirSync('./test/runtime').sort(function(a,b){
      return a.length - b.length;
    });

    testFiles.forEach(function(testFile){
      describe('#'+testFile.match(/\w+/), function(){
        require('./runtime/'+testFile)(runtime[testName], testName);
      });
    });

  });

});
