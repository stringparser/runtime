'use strict';

var should = require('should');

module.exports = function(runtime){
  should.exists(runtime);
  var app = runtime.create('stems');

  app.set(':num(\\d+)', function(next){
    setTimeout(function(){
      next(null, next.match, next.match);
    }, Math.random()*Number(next.match));

  });

  it('should accept (separated, strings)', function(done){
    app.note.set(function(next){
      if(next.stack.start){
        next.match.should.be.eql('1');
      }
      if(!next.stack.pending){
        next.match.should.be.eql('2');
        done();
      }
    });

    app.next('1', '2')();
  });

  it('should accept (join strings argument)', function(done){
    app.note.set(function(next){
      if(next.stack.start){
        next.match.should.be.eql('1');
      }
      if(!next.stack.pending){
        next.match.should.be.eql('2');
        done();
      }
    });

    app.next('1 2')();
  });

  it('should accept (separated, functions)', function(done){

    function one(next){ next(); }
    function two(next){ next(); }

    app.note.set(function(next){
      if(next.stack.start){
        next.path.should.be.eql('one');
      }
      if(!next.stack.pending){
        next.path.should.be.eql('two');
        done();
      }
    });

    app.next(one, two)();
  });

  app.set(':word([a-z]+)', function(next, one, two){
    setTimeout(function(){
      next(null, 1, two || 2);
    }, Math.random()*2);
  });

  it('should accept (string, function)', function(done){

    function one(next){ next(); }

    app.note.set(function(next){
      if(next.stack.start){
        next.path.should.be.eql('one');
      }
      if(!next.stack.pending){
        next.path.should.be.eql('two');
        done();
      }
    });

    app.next(one, 'two')();
  });
};
