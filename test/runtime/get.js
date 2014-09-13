
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

    it('Only 1-alias exists', function(){

      runtime.get()
        .children['1-alias'].should.be.ok;

      (runtime.get()
        .children['2-alias'] === void 0).should.be.true;

      (runtime.get()
        .children['3-alias'] === void 0).should.be.true;
    });

    it('All are in completion `array`', function(){

      runtime.get().completion
        .should
        .containDeep(
          ['1-alias', '2-alias --flag', '3-alias']
        );
    });

    it('All point to the 1st registered', function(){

      runtime.get('1-alias 2-alias')._name.should
        .be.exactly('1-alias');

      runtime.get('1-alias 3-alias')._name.should
        .be.exactly('1-alias');
    });

    it('All are registered on aliases but "1-alias"', function(){

      runtime.get().aliases
        .should.have.property('2-alias --flag', '1-alias');

      runtime.get().aliases
        .should.have.property('3-alias', '1-alias');

      runtime.get().aliases
        .should.not.have.property('1-alias');

    });

  });

};
