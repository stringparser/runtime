'use strict';

var Runtime = require('../');

it('uses the callback when a fn throws', function(done){
  var error = Error('on no!');
  var runtime = Runtime.create({});

  function one(){ throw error; }

  runtime.stack(one)(function(err){
    err.should.be.eql(error);
    done();
  });
});

it('uses the callback when passes the error', function(done){
  var error = Error('on no!');
  var runtime = Runtime.create({});

  function one(next){ next(error); }

  runtime.stack(one)(function(err){
    err.should.be.eql(error);
    done();
  });
});

it('runs the callback on completion', function(done){
  var runtime = Runtime.create({onHandleError: done});

  var count = 0;
  function one(next){
    ++count; next();
  }
  function two(next){
    ++count; next();
  }

  runtime.stack(one, two)(function(){
    count.should.be.eql(2);
    done();
  });
});

it('runs fns in parallel by default', function(done){
  var runtime = Runtime.create({onHandleError: done});

  var stack = '';
  function one(next){
    setTimeout(function(){
      stack += 'one';
      next();
    }, Math.random()*10);
  }
  function two(next){
    stack += 'two';
    next();
  }

  runtime.stack(one, two)(function(){
    stack.should.be.eql('twoone');
    done();
  });
});

it('{wait: true} runs functions in series', function(done){
  var runtime = Runtime.create({onHandleError: done});

  var stack = '';
  function one(next){
    setTimeout(function(){
      stack += 'one';
      next();
    }, Math.random()*10);
  }
  function two(next){
    stack += 'two';
    next();
  }

  runtime.stack(one, two, {wait: true})(function(){
    stack.should.be.eql('onetwo');
    done();
  });
});
