
var assert = require('assert');
var should = require('should');

module.exports = function(runtime, testName){

  var anchor;
  it('[1-nest] has handle', function(){
    anchor = runtime.get(['1-nest']);
    anchor.handle.should.be.a.Function;
    (anchor.handle.name === 'oneNest').should.be.true;
  });

  it('[1-nest, 2-nest] has no handle', function(){

    anchor = runtime.get(['1-nest', '2-nest']);

    (anchor._name === '2-nest').should.be.true;
    (anchor.handle === void 0).should.be.true;

  });

  it('[1-nest, 2-nest, 3-nest] has handle', function(){

    anchor = runtime.get('1-nest','2-nest', '3-nest');

    anchor.handle.should.be.a.Function;
    (anchor.handle.name === 'threeNest').should.be.true;

  });

};
