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
