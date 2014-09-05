
var test = ['Command'];
var len = test.length;
var runtime = {};

test.forEach(function(testName, index){

  /*
   * Sample instance
   * --
   * Each test gets its separate instance
   */

  runtime[testName] = (new require('../lib/runtime')).create(testName);

  runtime[testName]
    .set('1', function one(){ })
    .set('2', function two(){ })
    .set('3', function three(){ });

  runtime[testName]
    .set('1-nest')
    .set('1-nest 2-nest 3-nest', function threeNest(){ });

  runtime[testName]
    .set('1-alias', { alias : ['2-alias', '3-alias'] }, function oneAliased(){ return this; });

  describe('runtime.'+testName, function(){

    var testFiles = require('fs').readdirSync('./test/runtime').sort(function(a,b){
      return a.length - b.length;
    });

    testFiles.forEach(function(testFile, index){
      describe('#'+testFile.match(/\w+/), function(){
        require('./runtime/'+testFile)(runtime[testName], testName);
      });
    });

  });

});
