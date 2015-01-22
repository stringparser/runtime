'use strict';

var util = require('./lib/util');
var app = require('./.').create('next');

app.set(':handle', function one(next){
  if(next.wait){ next(); }
});

function nested(next){
  setTimeout(function(){ next(); }, 10);
  return 'fake';
}

function wait(next){
  if(next.wait){ next(); }
}

var compose = app.next(nested, 'thing', wait);

app.next('first second', compose, 'last')(0, 1, 2);
