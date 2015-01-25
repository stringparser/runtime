'use strict';
var should = require('should');

module.exports = function(runtime){
  should.exists(runtime);
  var app = runtime.create('dispatch');

  app.set('series', function(next){
    next.wait = true; next();
  });

  app.set('parallel', function(next){
    next.wait = false; next();
  });

  app.set(':handle', function(next){
    setTimeout(function(){
      next();
    }, Math.random()*Number(next.match));
  });

  var log = app.log;

  it('should dispatch in parallel by default', function(done){
    log.set(function(next){
      if(next.end){ next.stack.args.push(Number(next.match)); }
      if(!next.stack.pending){
        next.stack.args.filter(function(num, index){
          return num === index;
        }).length.should.be.lessThan(5);
        done();
      }
    });
    app.next('1 2 3 4 5')();
  });

  it('should dispatch in series if so decided', function(done){

    log.set(function(next){
      var num = Number(next.match);
      if(next.end && num){
        next.stack.args.push(num);
      }

      if(!next.stack.pending){
        next.stack.args.filter(function(num, index){
          return num === (index+1);
        }).length.should.be.eql(5);
        done();
      }
    });

    app.next('series 1 2 3 4 5')();
  });

  it('should dispatch series and parallel on demand', function(done){

    log.set(function(next){
      var num = Number(next.match);
      if(next.end && num){
        next.stack.args.push(num);
      }

      if(!next.stack.pending){
        var pile = next.stack.args;
        pile.should.have.property('length', 5);

        pile.slice(0, 3).filter(function(num, index){
          return num === (index+1);
        }).length.should.be.eql(3);

        pile.slice(3).filter(function(num, index){
          return num === (index+1);
        }).length.should.not.be.eql(2);

        done();
      }
    });

    app.next('series 1 2 3 parallel 4 5')();
  });
};
