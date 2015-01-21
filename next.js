'use strict';

var app = require('./.').create('next');

app.set(':handle', function one(next){
  next.args[2]++;
  console.log(next.args);
  console.log(next);
  if(next.wait){ next(); }
});

function nested(next){
  next.wait = true;
  console.log(next.args);
  setTimeout(function(){ next(); }, 10);
  return 'fake';
}

function wait(next){
  console.log(next.args);
  console.log(next);
  if(next.wait){ next(); }
}

var compose = app.next(nested, 'thing', wait);

app.next('first second', compose, 'last')(0, 1, 2);
