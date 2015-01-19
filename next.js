'use strict';

var app = require('./.').create('next');

app.set(':handle', function handloone(next){
  if(next.wait){ next(); }
});
app.set(':handle :two', function handleTwo(next){
  if(next.wait){ next(); }
});

function once(next){
  setTimeout(function(){ next(); }, 2);
  return 'fake';
}

function twice(next){
  console.log('wait?', next.wait);
  console.log(arguments);
  if(next.wait){ next(); }
}

app.next('one two', app.next(once, 'wavy', twice), 'end')(0, 1, 2);
