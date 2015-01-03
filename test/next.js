'use strict';
var should = require('should');

module.exports = function(Runtime){
  should.exists(Runtime);
  var app = Runtime.create('next');

  app.set('series', function(next){
    next.wait = true;
    var rtime = Math.random();
    setTimeout(function(){ next(); }, rtime);
  });

  app.set('parallel', function(next){
    next.wait = false;
    var rtime = Math.random();
    setTimeout(function(){ next(); }, rtime);
  });

  app.set(':handle', function(next){
    var rtime = Math.random()*10;
    setTimeout(function(){ next(); }, rtime);
  });

  it('should run in parallel by default', function(done){
    var stack = [];
    app.set('#report :handle', function(err, next){
      if(err){ return done(err); }
      if(next.time){ stack.push(next.found); }
      if(stack.length === next.argv.length){
        var test = stack.filter(function(item, index){
          return Number(item) === index;
        }).length;
        test.should.not.be.eql(next.argv.length);
        done();
      }
    });
    app.next('0 1 2 3 5 6');
  });

  it('should run in series if so needed', function(done){
    var stack = [];
    app.set('#report :handle', function(err, next){
      if(err){ return done(err); }
      if(next.time){ stack.push(next.found); }
      if(stack.length === next.argv.length){

        stack.slice(1).filter(function(item, index){
          return Number(item) === index;
        }).should.have.property('length', 4);

        done();
      }
    });

    app.next('series 0 1 2 3');
  });

  it('should run in parallel and series', function(done){
    var stack = [];
    app.set('#report :handle', function(err, next){
      if(err){ throw done(err); }
      if(next.time){ stack.push(next.found); }
      if(stack.length === next.argv.length){

        stack.slice(1, 5).filter(function(item, index){
          return Number(item) === index;
        }).should.have.property('length', 4);


        stack.slice(6).filter(function(item, index){
          return Number(item) === index;
        }).length.should.be.lessThan(4);

        done();
      }
    });
    app.next('series 0 1 2 3 parallel 0 1 2 3');
  });
};
