'use strict';

module.exports = function(runtime){
  var app = runtime.create({log: false});

  it('can be changed on demand but does not overwrite', function(done){
    app.set({onHandleError: done});

    function one(next){
      next.wait.should.be.eql(false);
      next();
    }
    function two(next){
      setTimeout(next, Math.random()*10);
      next.wait.should.be.eql(false);
      next.wait = true;
    }

    function three(next){
      next.wait.should.be.eql(false);
      next();
    }

    app.stack(one, two, three, {
      onHandleCall: function(next){
        if(next.match === 'two'){
          this.queue.should.match(/three/);
        }
      },
      onHandleEnd: function(){
        if(!this.queue){ done(); }
      }
    })();
  });

  it('does not propagate between stacks', function(done){
    app.set({onHandleError: done});

    function foo(next){
      next.wait = false;
      next();
    }

    function bar(next){
      next.wait.should.be.eql(true);
      next(); done();
    }

    app.stack(app.stack(foo), bar, {wait: true})();
  });

  it('the default should be parallel', function(done){
    app.set({onHandleError: done});

    var end = [];
    app.set(':handle(\\d+)', function(next){
      var stack = this;
      setTimeout(function(){
        end.push(next.params.handle);
        next(); if(stack.queue){ return ; }

        end.length.should.be.eql(5);
        end.should.not.be.eql([0,1,2,3,4]);

        done();
      }, Math.random()*10+1);
    });

    app.stack('0 1 2 3 4')();
  });

  it('for series indicate wait in options', function(done){
    app.set({onHandleError: done});

    var end = [];
    app.set(':handle(\\d+)', function(next){
      var stack = this;
      setTimeout(function(){
        end.push(next.params.handle);
        next(); if(stack.queue){ return ; }

        end.should.have.property('length', 6);
        end.map(Number).should.be.eql([0,1,2,3,4,5]);

        done();
      }, Math.random()*10);
    });

    app.stack('0 1 2 3 4 5', {wait: true})();
  });

  it('should handle series & parallel stacks', function(done){
    app.set({onHandleError: done});

    var end = {series:[], parallel:[]};
    app.set(':handle(\\d+)', function seriesParallel(next){
      var stack = this;
      setTimeout(function(){
        if(next.params.handle < 4){
          end.series.push(next.params.handle);
        } else {
          end.parallel.push(next.params.handle);
        }
        next();
        if(stack.queue){ return ; }

        end.series.map(Number).should.be.eql([0,1,2,3]);
        end.parallel.length.should.be.eql(6);
        end.parallel.map(Number).should.not.be.eql([4,5,6,7,8,9]);

        done();

      }, Math.random()*10);
    });

    app.stack('4 5 6 7 8 9', app.stack('0 1 2 3', {wait: true}))();
  });

  it('full series stack should have them all wait', function(done){
    app.set({onHandleError: done});

    var end = [];
    app.set(':handle(\\d+)', function sequence(next){
      var stack = this;
      setTimeout(function(){
        end.push(next.params.handle); next();
        if(stack.host.queue){ return ; }
        end.map(Number).should.be.eql([0,1,2,3,4,5]);
        done();
      }, Math.random()*10+1);
    });

    app.stack(
      app.stack('0 1 2', {wait: true}),
      app.stack('3 4 5', {wait: true}),
      {wait: true}
    )();

  });

  it('full series stack can be nested, but all should wait', function(done){
    app.set({onHandleError: done});

    var end = [];
    app.set(':handle(\\d+)', function sequence(next){
      var stack = this;
      setTimeout(function(){
        end.push(next.params.handle); next();
        if(stack.host.queue){ return ; }
        end.map(Number).should.be.eql([0,1,2,3,4,5]);
        done();
      }, Math.random()*10+1);
    });

    app.stack(
      app.stack('0 1', {wait: true}),
      app.stack('2 3', app.stack('4 5', {wait: true}), {wait: true}),
      {wait: true}
    )();

  });
};
