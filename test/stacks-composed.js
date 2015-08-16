'use strict';

var Runtime = require('../');

it('runs callback if fn throws from other stack', function(done){
  var error = Error('on no!');
  var runtime = Runtime.create();

  function one(next){ next(); }
  function two(){ throw error; }

  runtime.stack(one, runtime.stack(two))(function(err){
    err.should.be.eql(error);
    done();
  });
});

it('runs callback if error given to next from other stack', function(done){
  var error = Error('on no!');
  var runtime = Runtime.create();

  function one(next){ next(); }
  function two(next){ next(error); }

  runtime.stack(one, runtime.stack(two))(function(err){
    err.should.be.eql(error);
    done();
  });
});

it('runs the callback on completion of all stacks', function(done){
  var runtime = Runtime.create();

  var count = 0;
  function one(next){
    setTimeout(function(){
      ++count; next();
    }, Math.random()*10);
  }
  function two(next){
    setTimeout(function(){
      ++count; next();
    }, Math.random()*10*count);
  }

  runtime.stack(one, runtime.stack(two))(function(err){
    if(err){ return done(err); }
    count.should.be.eql(2);
    done();
  });
});

it('runs stacks in parallel by default', function(done){
  var runtime = Runtime.create();

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

  runtime.stack(runtime.stack(one), runtime.stack(two))(function(err){
    if(err){ return done(err); }
    stack.should.be.eql('twoone');
    done();
  });
});

it('{wait: true} should run stacks in series', function(done){
  var runtime = Runtime.create();

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

  runtime.stack(runtime.stack(one), runtime.stack(two), {wait: true})(
    function(err){
      if(err){ return done(err); }
      stack.should.be.eql('onetwo');
      done();
    }
  );
});

it('passes arguments when host and completed stack waits', function(done){
  var runtime = Runtime.create();

  function one(next, foo){
    foo.should.be.eql(1);
    next(2);
  }
  function two(next, foo){
    foo.should.be.eql(2);
    next();
  }

  runtime.stack(
    runtime.stack(one, {wait: true}),
    runtime.stack(two),
    {wait: true}
  )(1, 2, done);
});

it('does NOT pass arguments when stacks does NOT wait', function(done){
  var runtime = Runtime.create();

  function one(next, foo){
    foo.should.be.eql(1);
    next(2);
  }
  function two(next, foo){
    foo.should.be.eql(1);
    next();
  }

  runtime.stack(
    runtime.stack(one),
    runtime.stack(two)
  )(1, 2, done);
});
