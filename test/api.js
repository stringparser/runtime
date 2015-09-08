'use strict';

var Runtime = require('../.');

it('onHandle is called before and after each site', function(done){
  var count = 0;

  var runtime = Runtime.create({
    onHandle: function(){
      ++count;
    }
  });

  function one(next){ next(); }
  function two(next){ next(); }

  runtime.stack(one, two)(function(err){
    if(err){ return done(err); }
    count.should.be.eql(4);
    done();
  });
});

it('nested: onHandle is called before and after each site', function(done){
  var count = 0;

  var runtime = Runtime.create({
    onHandle: function(){
      ++count;
    }
  });

  function one(next){ next(); }
  function two(next){ next(); }

  runtime.stack(one, runtime.stack(two))(function(err){
    if(err){ return done(err); }
    count.should.be.eql(6);
    done();
  });
});

it('context for each stack can be given {context: [Object]}', function(done){
  var runtime = Runtime.create();

  runtime.stack(function one(next){
    this.params.should.be.eql(1);
    next();
  }, {context: {params: 1}})(function(err){
    if(err){ return done(err); }
    done();
  });
});

it('can be reused with no side-effects', function(done){
  var count = 0;
  var runtime = Runtime.create();

  var stack = runtime.stack(function one(next){
    ++count;
    this.param = ++this.param;
    this.param.should.be.eql(1);
    next();
  }, {context: {param: 0}});

  runtime.stack(stack, stack)(function(err){
    if(err){ return done(err); }
    count.should.be.eql(2);
    done();
  });
});

it('create({wait: true}) makes all stacks wait', function(done){
  var count = -1;
  var runtime = Runtime.create({wait: true});

  var stack = [];
  function one(next){
    var pos = ++count;
    setTimeout(function(){
      stack.push(pos);
      next();
    }, Math.random()*10);
  }

  runtime.stack(one,
    runtime.stack(one,
      runtime.stack(one,
        runtime.stack(one,
          runtime.stack(one)
        )
      )
    )
  )(function(err){
    if(err){ return done(err); }
    stack.should.be.eql([0, 1, 2, 3, 4]);
    done();
  })
});

it('next.repeat reruns the handle', function(done){
  var stack = [];
  var runtime = Runtime.create();

  function whilst(next, count){
    if(++count < 10){
      stack.push(count);
      next.repeat = true;
    }
    next(null, count);
  }

  runtime.stack(whilst)(-1, function(err, result){
    if(err){ return done(err); }
    result.should.be.eql(9);
    stack.should.be.eql([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    done();
  });
});
