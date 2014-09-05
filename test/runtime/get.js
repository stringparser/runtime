
var assert = require('assert');

module.exports = function(runtime, testName){


  it('[] depth === 0', function(){
    runtime.get()
      .should.have.property('_depth').and.be.exactly(0);
  });

  it('[1-nest, 2-nest] && "1-nest 2-nest" depth === 2', function(){

    runtime.get("1-nest 2-nest")._depth
        .should.be.exactly(2);
    runtime.get(["1-nest","2-nest"])._depth
        .should.be.exactly(2);
  });

  it('[1-nest, 2-nest, 3-nest] & "1-nest 2-nest 3-nest" depth === 3', function(){
      runtime.get("1-nest 2-nest 3-nest")._depth
        .should.be.exactly(3);

      runtime.get(["1-nest","2-nest", "3-nest"])._depth
        .should.be.exactly(3);
  });

  describe('- Aliases', function(){

    var anchor = runtime.get();

    it('Only 1-alias exists', function(){

      anchor.child['1-alias'].should.be.ok;
      (anchor.child['2-alias'] === void 0 ).should.be.true;
      (anchor.child['3-alias'] === void 0 ).should.be.true;
    });

    it('All are in completion `array`', function(){

      var completion = runtime.get().completion;

      completion.should.containDeep(
        ['1-alias', '2-alias','3-alias']
      );

    });

    it('All point to the 1st registered', function(){

      anchor = runtime.get(['2-alias']);
      anchor._name.should.be.exactly('1-alias');

      anchor = runtime.get(['3-alias']);
      anchor._name.should.be.exactly('1-alias');
    });

    it('All are registered on aliases but "1-alias"', function(){

      var aliases = runtime.get().alias;

      aliases.should.have.property('2-alias', '1-alias');
      aliases.should.have.property('3-alias', '1-alias');
      aliases.should.not.have.property('1-alias');

    });

  });

};
