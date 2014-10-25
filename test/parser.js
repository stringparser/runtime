'use strict';

var should = require('should');

module.exports = function(pack, util){
  should.exists(util);
  var runtime = pack.create('parser');

  it('should parse arguments with minimist', function(){
    var parsed = runtime.parser('hello world --beep=boop');
    parsed.should.be.eql({
           _ : ['hello', 'world'],
        beep : 'boop',
      hrtime : parsed.hrtime
    });
  });
  it('should parse argv and camelcase them', function(){
    var parsed = runtime.parser('--foo-bar=value1 --some-flag=value2');
    parsed.should
      .be.eql({
               _ : [],
          fooBar : 'value1',
          hrtime : parsed.hrtime,
        someFlag : 'value2'
      });
  });
};
