'use strict';

var app = require('./.').create('next');

app.set(':handle', function one(next){
  if(next.wait){ next(); }
  console.log(next.match);
});

function nested(next){
  setTimeout(function(){ console.log(next.match); next(); }, 10);
  return 'fake';
}

function wait(next){
  console.log(next.match);
}

var compose = app.next(nested, 'thing', wait);

app.next('first second', compose, 'last')(0, 1, 2);
