'use strict';

var app = require('../.').create();

;['one', 'two', 'three'].forEach(function(path){
  app.set(path, function(next){
    setTimeout(next, Math.random()*10);
  });
});

app.repl();
