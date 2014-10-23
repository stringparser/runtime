'use strict';

var should = require('should');

module.exports = function(pack, util){
  should.exists(util);
  var runtime = pack.create('consumer');

  runtime.set('foo', function(argv, args, next){
    argv.push('--flag', 'fooWasRunned');
    next(argv);
  });
  runtime.set('--flag', function(argv, args, next){
    if(argv.indexOf('fooWasRunned') < 0 ){
      argv.push('flagWasRunned');
    } else {
      argv.push('flagWasRunnedAfterFoo');
    }
    next(argv, args);
  });

  it('rootNode should dispatch if no command exists', function(done){
    var line = 'notRegisteredCommand --flag';
    var parsed = runtime.parser(line);
    runtime.set(function(argv, args){
      args.should.be.eql(parsed);
      done();
    });
    runtime.input.write(line+'\n');
  });

  it('should run registered functions', function(done){
    var line = 'foo';
    var parsed = runtime.parser('fooWasRunned flagWasRunnedAfterFoo');
    runtime.set(function(argv, args){
      argv.should.be.eql(parsed._);
      args.should.be.eql(parsed);
      done();
    });
    runtime.input.write(line+'\n');
  });

  it('should run flags', function(done){
    var line = '--flag';
    var parsed = runtime.parser('flagWasRunned');
    runtime.set(function(argv, args, next){
      argv.should.be.eql(parsed._);
      args.should.be.eql(parsed);
      if( !next() ){ done(); }
    });
    runtime.input.write(line+'\n');
  });

  it('should run the registered functions if exists', function(done){
    var line = 'foo --flag';
    var index = 0;
    var called = [
      ['fooWasRunned', 'flagWasRunnedAfterFoo', 'flagWasRunnedAfterFoo']
    ];
    runtime.set(function(argv, args, next){
      argv.should.be.eql(called[index]);
      if( !next() ){ done(); }
    });
    runtime.input.write(line+'\n');
  });
};
