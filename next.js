'use strict';

var app = require('./.').create('next');

app.set(':handle', function handloone(next){
  next.wait = true; console.log(next.params.handle);
  if(next.wait){ next(); }
});
app.set(':handle :two', function handleTwo(next){
  if(next.wait){ next(); }
});

function once(next){
  setTimeout(function(){ next(); }, 10);
  return 'fake';
}

function twice(next){
  if(next.wait){ next(); }
}

app.next('one two three', app.next(once, 'wavy', twice), 'four')(0, 1, 2);
