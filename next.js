'use strict';

var app = require('./.').create('next');

app.set(':handle :this', function one(next){
  if(next.wait){ next(); }
});

function nested(next){
  next.wait = true;
  setTimeout(next, 10);
  return 'fake';
}

function wait(next){
  next();
}

var compose = app.next(nested, 'thing', wait);

app.next('first second', compose, 'last')(0, 1, 2);
