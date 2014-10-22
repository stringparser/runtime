'use strict';

var should = require('should');

module.exports = function(pack, util){
  should.exists(util);
  var runtime = pack.create('consumer');

  runtime.set('foo', function(argv, args, next){
    argv.push('fooWasRunned');
    next(argv);
  });
  runtime.set('--flag', function(argv, args, next){
    argv.push('--flagWasRunned');
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
    var lexed = runtime.lexer(line);
    var parsed = runtime.parser(line);
    runtime.set(function(argv, args){
      argv.should
        .be.eql(lexed.slice(1).concat('fooWasRunned'));
      args.should.be.eql(parsed);
      done();
    });
    runtime.input.write(line+'\n');
  });

  it('should run flags', function(done){
    var line = '--flag 3 -y 4';
    var lexed = runtime.lexer(line);
    var parsed = runtime.parser(line);
    runtime.set(function(argv, args, next){
      argv.should.be.eql(
        lexed.slice(1).concat('--flagWasRunned')
      );
      args.should.be.eql(parsed);
      var more = next();
      console.log('done?', more);
      if( !more ){ done(); }
    });
    runtime.input.write(line+'\n');
  });

  it('should run the registered functions if exists', function(done){
    var line = 'foo --flag';
    var index = 0;
    var called = [
      ['fooWasRunned', '--flagWasRunned']
    ];
    runtime.set(function(argv, args, next){
      argv.should.be.eql(called[index]);
      if( !next() ){ done(); }
    });
    runtime.input.write(line+'\n');
  });
};
