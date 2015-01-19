'use strict';

var app = require('./.').create('next');

app.set(':handle', function handloone(next){
  if(next.wait){ next(); }
});
app.set(':handle :two', function handleTwo(next){
  if(next.wait){ next(); }
});

function once(next){
  next.wait = true;
  setTimeout(function(){ next(); }, 10);
  return 'fake';
}

function twice(next){
  if(next.wait){ next(); }
}

app.next('one two three', app.next(once, 'wavy', twice), 'four five six')(0, 1, 2);
