'use strict';

var app = require('./.').create('next');

app.set(':handle', function one(next){
  if(next.wait){ next(); }
  return 'result';
});

function nest(next){
  next.wait = true;
  setTimeout(next, 10);
}

function wait(next){
  if(next.wait){ next(); }
  console.log('res', next.result);
}

var compose = app.next(nest, wait);

app.next(['first', compose, 'last'])(0, 1, 2);
