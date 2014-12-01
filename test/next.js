'use strict';

var should = require('should');

module.exports = function(pack, util){
  should.exists(util);
  var runtime = pack.create('next');

  runtime.set('foo', function(){
    this.argv.push('--flag', 'fooWasRunned');
  });
  runtime.set('--flag', function(){
    if(this.argv.indexOf('fooWasRunned') < 0 ){
      this.argv.push('flagWasRunned');
    } else {
      this.argv.push('flagWasRunnedAfterFoo');
    }
  });

  it('rootNode should dispatch if no command exists', function(done){
    var line = 'notRegisteredCommand --flag';
    var run = line.split(/[ ]+/);
    runtime.set(function(){
      console.log('ctx', this);
      this.argv.should.be.eql(run);
      this.args.should.be.eql({
           _ : run.slice(0,1),
        flag : true
      });
      done();
    });
    runtime.next(line);
  });

  it('should run registered functions', function(done){
    var line = 'foo';
    runtime.set(function(){
      if( this.cmd.done ){
        var run = ['fooWasRunned', 'flagWasRunnedAfterFoo'];
        this.argv.should.be.eql(run);
        this.args.should.be.eql({ _ : ['foo'] });
        done();
      }
    });
    runtime.next(line);
  });

  it('should run flags', function(done){
    var line = '--flag';
    var run = ['flagWasRunned'];
    runtime.set(function(){
      if( this.cmd.done && this.args.flag ){
        this.argv.should.be.eql(run);
        this.args.should.be.eql({ _ : [], flag : true });
        done();
      }
    });
    runtime.next(line);
  });

  it('should run the registered functions if exists', function(done){
    var line = 'foo --flag';
    var run = [
     'fooWasRunned', 'flagWasRunnedAfterFoo', 'flagWasRunnedAfterFoo'
    ];
    runtime.set(function(){
      if( this.cmd.done ){
        this.argv.should.be.eql(run);
        this.args.should.be.eql({ _ : ['foo'], flag : true });
        done();
      }
    });
    runtime.next(line);
  });
};
