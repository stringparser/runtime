
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
    .set('1', function(){ return this; })
    .set('2', function(){ return this.get('2'); })
    .set('3', function(){ return this.get('3'); })
    .set('4', function(){ return this.get('4'); });

  runtime[testName]
    .set('1-nest', function(){ return this.get('1-nest'); })
    .set('1-nest 2-nest', function(){ return this.get('2-nest'); })
    .set('1-nest 2-nest 3-nest', function(){ return this.get('3-nest'); })
    .set('1-nest 2-nest 3-nest 4-nest', function(){ return this.get('4-nest'); });

  runtime[testName]
    .set(['1-alias', '2-alias', '3-alias', '4-alias'], function(){ return this; });

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

  if( index === len-1 ){
    process.stdin.end();
  }
});
