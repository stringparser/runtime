'use strict';

var Runtime = require('../.');

it('calls onHandle before and after calling each site', function(done){
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

it('nested: calls onHandle before and after each site', function(done){
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
