'use strict';

var runtime = require('./.');
var app = runtime.create('app');

app.set('handle', function(next){
  setTimeout(next, Math.random()*10);
});

// app.stack(
//   app.stack('1 2 3', {wait: true}),
//   app.stack('4 5 6',
//     app.stack('7 8 9', {wait: true}),
//   {wait: true}),
// {wait: true})(1,2,3);

app.repl();
console.log(Object.keys(require));
