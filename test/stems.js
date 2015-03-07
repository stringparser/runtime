'use strict';

var should = require('should');

module.exports = function(runtime){
  should.exists(runtime);
  var app = runtime.create('stems', {log: false});

  it('should accept (separated, strings)', function(done){
    app.set({onError: done});

    app.set('1', function(next){
      next.match.should.be.eql('1');
      next.path.should.be.eql('1');
    });

    app.set('2', function(next){
      next.match.should.be.eql('2');
      next.path.should.be.eql('2');
      done();
    });

    app.stack('1', '2')();
  });

  it('should accept (join strings argument)', function(done){
    app.set({onError: done});

    app.set('1', function(next){
      next.match.should.be.eql('1');
      next.path.should.be.eql('1 2');
    });

    app.set('2', function(next){
      next.match.should.be.eql('2');
      next.path.should.be.eql('2');
      done();
    });

    app.stack('1 2')();
  });

  it('should accept (function, function)', function(done){
    app.set({onError: done});

    function one(next){
      next.match.should.be.eql('one');
    }

    function two(next){
      next.match.should.be.eql('two');
      done();
    }

    app.stack(one, two)();
  });

  it('should accept (string, function)', function(done){
    app.set({onError: done});

    app.set('a :string', function(next){
      next.match.should.be.eql('a word');
    });

    function two(next){
      next.match.should.be.eql('two');
      done();
    }

    app.stack('a word', two)();
  });
};
