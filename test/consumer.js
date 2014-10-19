'use strict';

var should = require('should');

module.exports = function(pack, util){
  should.exists(util);
  var runtime = pack.create('consumer');

  runtime.set('foo', function(argv, args, next){
    argv.push('foo was runned');
    next(argv, args);
  });
  runtime.set('--flag', function(argv, args, next){
    argv.push('--flag was runned');
    next(argv, args);
  });

  it('rootNode should dispatch if no command exists', function(done){
    var index = 0;
    var line = 'notRegisteredCommand --flag';
    var parsed = runtime.parser(line);
    runtime.set(function(argv, args, next){
      args.should.be.eql(parsed);
      if( ++index === 2 ){
        argv.should.be.eql(line.split(/[ ]+/));
        return done();
      }
      if( !next(argv, args) ){ done(); }
    });
    runtime.input.write(line+'\n');
  });

  it('should run from lexed and parsed a registered fn', function(done){
    var line = 'foo 3 bar 4 -x 3 -y 4 -abc --beep=10';
    var lexed = runtime.lexer(line);
    var parsed = runtime.parser(line);
    runtime.set(function(argv, args, next){
      argv.should.be.eql(lexed.slice(1).concat('foo was runned'));
      args.should.be.eql(parsed);
      if( !next(argv, args) ){ done(); }
    });
    runtime.input.write(line+'\n');
  });

  it('should run flags', function(done){
    var line = '--flag 3 -y 4';
    var lexed = runtime.lexer(line);
    var parsed = runtime.parser(line);
    runtime.set(function(argv, args, next){
      argv.should.be.eql(lexed.slice(1).concat('--flag was runned'));
      args.should.be.eql(parsed);
      if( !next(argv, args) ){ done(); }
    });
    runtime.input.write(line+'\n');
  });

  it('should run the registered functions if exists', function(done){
    var line = 'foo --flag';
    var index = 0;
    var called = [
      ['foo was runned', '--flag was runned']
    ];
    runtime.set(function(argv, args, next){
      argv.should.be.eql(called[index]);
      index++;
      if( !next(argv, args) ){ done(); }
    });
    runtime.input.write(line+'\n');
  });
};
