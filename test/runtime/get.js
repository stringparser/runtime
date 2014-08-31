
var assert = require('assert');

module.exports = function(runtime, testName){

  it('#get()._depth === 0?', function(){
    assert( runtime.get()._depth === 0 );
  });

  it('#get("1-nest", "2-nest", "3-nest")._depth === 3?', function(){
    assert( runtime.get("1-nest","2-nest", "3-nest")._depth === 3 );
  });

  it('#get(["1-nest", "2-nest", "3-nest"])._depth === 3?', function(){

    assert( runtime.get(["1-nest","2-nest", "3-nest"])._depth === 3 );
  });

  describe('- Aliases', function(){
    it('#get("1-alias")._name === #get("2-alias")._name?', function(){
      assert(
        runtime.get("1-alias")._name === runtime.get("2-alias")._name
      );
    });
  });

};
