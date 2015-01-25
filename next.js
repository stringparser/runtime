'use strict';

var app = require('./.').create('next');

app.set(':handle', function one(next){
  if(next.wait){ next(); }
  return 'result';
});

function nested(next){
  next.wait = true;
  setTimeout(next, 10);
  return next.result;
}

function wait(next, res){
  console.log('res', res); next();
  return next.result;
}

var compose = app.next(nested, wait);

app.next('first', compose, 'last')(0, 1, 2);
