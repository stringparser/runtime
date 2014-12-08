'use strict';
/* global Runtime: true */
var runtime = Runtime.create('next');

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
    if( this.done ){
      this.argv.should.be.eql(run.concat('flagWasRunned'));
      this.params.should.be.eql({
           _ : run.slice(0,1),
        flag : true
      });
      done();
    }
  });
  runtime.next(line);
});

it('should run registered functions', function(done){
  var line = 'foo';
  runtime.set(function(){
    if( this.done ){
      var run = ['foo', '--flag', 'fooWasRunned', 'flagWasRunnedAfterFoo'];
      this.argv.should.be.eql(run);
      this.params.should.be.eql({ _ : ['foo'] });
      done();
    }
  });
  runtime.next(line);
});

it('should run flags', function(done){
  var line = '--flag';
  var run = [ '--flag', 'flagWasRunned'];
  runtime.set(function(){
    if( this.done ){
      this.argv.should.be.eql(run);
      this.params.should.be.eql({ _ : [], flag : true });
      done();
    }
  });
  runtime.next(line);
});

it('should run the registered functions if exists', function(done){
  var line = 'foo --flag';
  var run = [
   'foo', '--flag', '--flag',
   'fooWasRunned', 'flagWasRunnedAfterFoo', 'flagWasRunnedAfterFoo'
  ];
  runtime.set(function(){
    if( this.done ){
      this.argv.should.be.eql(run);
      this.params.should.be.eql({ _ : ['foo'], flag : true });
      done();
    }
  });
  runtime.next(line);
});
