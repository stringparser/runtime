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
    next();
  });

  it('rootNode should dispatch if no command exists', function(done){
    var line = 'notRegisteredCommand --flag';
    var run = line.split(/[ ]+/);
    runtime.set(function(argv, args){
      delete args.hrtime;
      delete args.time;
      argv.should.be.eql(run);
      args.should.be.eql({
           _ : run.slice(0,1),
        flag : true
      });
      done();
    });
    runtime.input.write(line+'\n');
  });

  it('should run registered functions', function(done){
    var line = 'foo';
    runtime.set(function(argv, args, next){
      delete args.hrtime;
      delete args.time;
      if( !next() && args.flag ){
        delete args.hrtime;
        var run = ['fooWasRunned', 'flagWasRunnedAfterFoo'];
        argv.should.be.eql(run);
        args.should.be.eql({ _ : [], flag : 'fooWasRunned' });
        done();
      }
    });
    runtime.input.write(line+'\n');
  });

  it('should run flags', function(done){
    var line = '--flag';
    var run = ['flagWasRunned'];
    runtime.set(function(argv, args, next){
      if( !next() && args.flag ){
        delete args.hrtime;
        delete args.time;
        argv.should.be.eql(run);
        args.should.be.eql({ _ : [], flag : true });
        done();
      }
    });
    runtime.input.write(line+'\n');
  });

  it('should run the registered functions if exists', function(done){
    var line = 'foo --flag';
    var run = [
     'fooWasRunned', 'flagWasRunnedAfterFoo', 'flagWasRunnedAfterFoo'
    ];
    runtime.set(function(argv, args, next){
      delete args.hrtime;
      delete args.time;
      if( args.flag === 'fooWasRunned' ){
        argv.should.be.eql(run);
        args.should.be.eql({ _ : [], flag : 'fooWasRunned' });
      }
      if( !next() && args.flag === true ){
        argv.should.be.eql(run);
        args.should.be.eql({ _ : ['foo'], flag : true });
        done();
      }
    });
    runtime.input.write(line+'\n');
  });
};
