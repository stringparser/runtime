
var assert = require('assert');

module.exports = function(runtime, testName){

  it('!runtime.get().handle', function(){
    assert( !runtime.get().handle );
  });

  it('runtime.get("1").handle()._name === runtime.get("1")._name', function(){
    assert( runtime.get("1").handle()._name === runtime.get("1")._name );
  });

};
