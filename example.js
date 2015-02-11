'use strict';

var runtime = require('./.');
var should = require('should');
var app = runtime.create('app');

should.exists(app);
var tick = app.next(one, app.next(two), three, {wait: true});

tick(1,2,3);

function one(next, foo, bar, baz){
  foo.should.be.eql(1);
  bar.should.be.eql(2);
  baz.should.be.eql(3);
  next(null, 2, 3, 4);
}

function two(next, foo, bar, baz){
  foo.should.be.eql(2);
  bar.should.be.eql(3);
  baz.should.be.eql(4);
  next(null, 3, 4, 5);
}

var count = 0;
function three(next, foo, bar, baz){
  foo.should.be.eql(3);
  bar.should.be.eql(4);
  baz.should.be.eql(5);
  if(next.wait){ next(); }
  if(count++ < 1){
    console.log(tick);
    tick(1,2,3);
  }
}

var argv = process.argv.slice(2);
if(argv.length){ app.next(argv); }
