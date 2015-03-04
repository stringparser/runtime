'use strict';
var should = require('should');

module.exports = function(runtime){
  should.exists(runtime);
  var app = runtime.create('dispatch', {log: false});

  app.set('series', function(next){
    next.wait = true; next();
  });

  app.set('parallel', function(next){
    next.wait = false; next();
  });

  it('should dispatch in parallel by default', function(done){
    var pile = [];
    app.set(':handle(\\d+)', function(next){
      var stack = this;
      setTimeout(function(){
        pile.push(Number(next.match));
        next(); if(stack.pending){ return ; }
        pile.length.should.be.eql(5);
        pile.filter(function(elem, index){
          return (index+1) === elem;
        }).length.should.be.lessThan(5);
        done();
      }, Math.random()*10+1);
    });

    app.stack('1 2 3 4 5')();
  });

  it('should dispatch in series if so desired', function(done){
    var pile = [];
    app.set(':handle(\\d+)', function(next){
      var stack = this;
      setTimeout(function(){
        pile.push(Number(next.match));
        next(); if(stack.pending){ return ; }
        pile.length.should.be.eql(5);
        pile.filter(function(elem, index){
          return (index+1) === elem;
        }).length.should.be.eql(5);
        done();
      }, Math.random()*10+1);
    });

    app.stack('series 1 2 3 4 5')();
  });

  it('series and parallel should be able to share space', function(done){

    var pile = [];
    app.set(':handle(\\d+)', function seriesParallel(next){
      var stack = this;
      setTimeout(function(){
        next();
        pile.push(Number(next.match));
        if(stack.pending){ return ; }
        pile.slice(0, 3).should.be.eql([1,2,3]);
        pile.slice(3).should.not.be.eql([4,5,6]);

        done();

      }, Math.random()*10+1);
    });

    app.stack('series 1 2 3 parallel 4 5 6')();
  });

  it('wait state can be changed on demand', function(done){

    function one(next){
      next.wait = 1;
      setTimeout(function(){
        next.wait = 0;
        next();
      }, 1);
    }

    function two(next){
      next.wait++;
      next();
    }

    function three(next){
      next.wait.should.be.eql(1);
      done();
    }

    app.stack(one, two, three)();
  });
};
