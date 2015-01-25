'use strict';

var should = require('should');

module.exports = function(runtime){
  should.exists(runtime);
  var app = runtime.create('stems');
  var log = app.log;

  app.set(':num(\\d+)', function(next){
    next(null, next.match, next.match);
  });

  it('should accept (separated, strings)', function(done){
    log.set(function(next){
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

  it('should accept (joined strings)', function(done){
    log.set(function(next){
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

    log.set(function(next){
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

  it('should accept (string, function)', function(done){

    function one(next){ next(); }

    log.set(function(next){
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

  app.set(':word([a-z]+)', function(next, one, two){
    setTimeout(function(){
      next(null, 1, two || 2);
    }, Math.random()*Number(next.match));
  });

  it('should treat registered handlers and functions equally', function(done){
    function handle(next, one){
      next(null, one || 1, 2);
    }

    log.set(function(next){
      if(!next.stack.pending){
        next.stack.args.should.be.eql([1,2]);
        done();
      }
    });

    app.next('string', handle)();
  });

  it('should treat registered handlers and functions equally', function(done){
    function handle(next, one){
      next(null, one || 1, 2);
    }

    log.set(function(next){
      if(!next.stack.pending){
        next.stack.args.should.be.eql([1,2]);
        done();
      }
    });

    app.next('string', handle)();
  });
};
