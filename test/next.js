'use strict';
var should = require('should');

module.exports = function(Runtime){
  should.exists(Runtime);
  var app = Runtime.create('next');

  app.set(':mode([a-z]+)', function(next){
    if(next.params.mode === 'series'){
      next.wait = true;
    } else { next.wait = false; }
  });

  app.set(':run(\\d+)', function defaults(next){
    setTimeout(next, 10*Math.random());
  });

  it('should run in parallel by default', function(done){
    var pile = []; var end = false;
    

    app.next('0 1', '2 3', '4 5 6 7 8 9 10')();
  });

  it('should run in series if so needed', function(done){
    var pile = [];
    app.set('#report', function(err, next){
      if(err){ return done(err); }
      if(!next.end){ pile.push(next.match); }

      pile.slice(1).filter(function(item, index){
        return Number(item).should.be.eql(index);
      });
      done();
    });

    app.next('series 0 1 2 3')();
  });

  it('should run in parallel and series', function(done){
    var pile = [];
    app.set('#report', function(err, next){
      if(err){ return done(err); }
      if(!next.end){ pile.push(next.match); }

      pile.slice(1, 3).filter(function(item, index){
        return Number(item).should.be.eql(index);
      });

      pile.slice(6).filter(function(item, index){
        return Number(item) === index;
      }).length.should.be.lessThan(4);

      done();
    });
    app.next('series 0 1 parallel 0 1 2 3')();
  });
};
