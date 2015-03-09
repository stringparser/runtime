'use strict';

var runtime = require('./.');
var app = runtime.create('app');

app.set(':handle', function(next){
  setTimeout(next, Math.random()*10);
});

;['one', 'two', 'three', 'four']
  .forEach(function(item){
    app.set(item, function(next){
      setTimeout(next, Math.random()*10);
    });
  });

app.repl();
