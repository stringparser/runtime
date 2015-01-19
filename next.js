'use strict';

var app = require('./.').create('next');

app.set(':handle', function handloone(next, args){
  // console.log(next.match, args);
  // console.log('wait?', next.wait);
  if(next.wait){ next(); }
});
app.set(':handle :two', function handleTwo(next, args){
  // console.log(next.match, args);
  // console.log('wait?', next.wait);
  if(next.wait){ next(); }
});

function once(next, args){
  next.wait = true;
  // console.log(next.path, args);
  // console.log('wait?', next.wait);
  setTimeout(function(){ next(); }, 10);
  return 'fake';
}

function twice(next, args){
  // console.log(next.path, args);
  // console.log('wait?', next.wait);
  if(next.wait){ next(); }
}

app.next('one two', app.next(once, 'wavy', twice), 'and end here')(0, 1, 2);
