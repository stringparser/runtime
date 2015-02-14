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
    setTimeout(next, Math.random()*10+1);
  });

  it('should dispatch in parallel by default', function(done){
    var pile = [];
    function annotate(err, next){
      if(err){ throw err; }

      if(next.end){ pile.push(Number(next.match)); }
      if(next.stack.pending){ return ; }
      pile.should.have.property('length', 5);
      pile.filter(function(item, index){
        return index === item;
      }).length.should.be.lessThan(5);
      done();
    }

    app.note.set(':handle', annotate);

    app.next('1 2 3 4 5')();
  });

  it('should dispatch in series if so desired', function(done){
    var pile = [];
    app.note.set('series', function seriesNotes(err, next){
      if(err){ throw err; }

      var num = Number(next.match);
      if(next.end && num){ pile.push(num); }
      if(next.stack.pending){ return ; }

      pile.should.have.property('length', 5);
      pile.filter(function(item, index){
        return (index + 1) === item;
      }).length.should.be.eql(5);

      done();
    });

    app.next('series 1 2 3 4 5')();
  });

  it('series and parallel can share space', function(done){

    var num, pile = [];
    app.note.set('series', function(err, next){
      if(err){ throw err; }

      num = Number(next.match);
      if(next.end && num){ pile.push(num); }
      if(next.stack.pending){ return ; }

      pile.should.have.property('length', 6);
      pile.slice(0,3).filter(function(item, index){
        return (index+1) === item;
      }).length.should.be.eql(3);

      pile.slice(3).filter(function(item, index){
        return (index+4) === item;
      }).length.should.be.lessThan(3);

      done();
    });

    app.next('series 1 2 3 parallel 3 4 5')();
  });
};
