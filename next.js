'use strict';

var app = require('./.').create('next');

app.set(':handle', function one(next){
  if(next.wait){ next(); }
});

function nested(next){
  setTimeout(next, 10);
  return 'fake';
}

function wait(){
}

var compose = app.next(nested, 'thing', wait);

app.next('first second', compose, 'last')(0, 1, 2);
