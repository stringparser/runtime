'use strict';

var runtime = require('./.');
var should = require('should');
var app = runtime.create('app');

should.exists(app);

var tick = app.next(one, two, three);

var count = -1;
function one(next, foo, bar, baz){
  console.log('wait?', next.wait);
  console.log('\n-- Tick(%s) --', ++count);
  foo.should.be.eql(count+1);
  bar.should.be.eql(count+2);
  baz.should.be.eql(count+3);
  next(null, count+2, count+3, count+4);
  return 'one';
}

function two(next, foo, bar, baz){
  console.log('wait?', next.wait);
  foo.should.be.eql(count+2);
  bar.should.be.eql(count+3);
  baz.should.be.eql(count+4);
  next(null, count+3, count+4, count+5);
}

function three(next, foo, bar, baz){
  foo.should.be.eql(count+3);
  bar.should.be.eql(count+4);
  baz.should.be.eql(count+5);
  if(next.wait){ next(null, count+2, count+3, count+4); }
}

app.next(tick, tick, {wait: true})(1,2,3);

var argv = process.argv.slice(2);
if(argv.length){ app.next(argv); }
