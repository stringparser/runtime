'use strict';

var Runtime = require('../');

it('runs the callback on completion', function(done){
  var runtime = Runtime.create({onHandleError: done});

  var count = 0;
  function one(next){
    ++count; next();
  }
  function two(next){
    ++count; next();
  }

  runtime.compose(one, two)(function(){
    count.should.be.eql(2);
    done();
  });
});

it('runs functions in parallel by default', function(done){
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

  runtime.compose(one, two)(function(){
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

  runtime.compose(one, two, {wait: true})(function(){
    stack.should.be.eql('onetwo');
    done();
  });
});
