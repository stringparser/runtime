'use strict';

var runtime = require('./.');
var should = require('should');
var app = runtime.create('app');

should.exists(app);

var tick = app.next(app.next(one, two), three, {wait: true});

function one(next){
  if(next.wait){ next(); }
}

function two(next){
  if(next.wait){ next(); }
}

var count = 0;
function three(next){
  if(next.wait){ next(); }
  if(count++ < 1){
    console.log(' -- new Tick -- ');
    tick(1, 2, 3);
    console.log(tick);
  }
}

tick(1, 2, 3);

var argv = process.argv.slice(2);
if(argv.length){ app.next(argv); }
