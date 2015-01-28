'use strict';

var runtime = require('./.');
var should = require('should');
var app = runtime.create('app');

should.exists(app);

function one(next, foo, bar, baz){
  foo.should.be.eql(1);
  bar.should.be.eql(2);
  baz.should.be.eql(3);
}

function two(next, foo, bar, baz){
  foo.should.be.eql(1);
  bar.should.be.eql(2);
  baz.should.be.eql(3);
}

function three(next, foo, bar, baz){
  foo.should.be.eql(1);
  bar.should.be.eql(2);
  baz.should.be.eql(3);
}

app.next(app.next(one), two)(1, 2, 3);

var argv = process.argv.slice(2);
if(argv.length){ app.next(argv); }
