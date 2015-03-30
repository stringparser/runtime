'use strict';

var app = require('./.').create();

app.set(':handle', function(next){
  setTimeout(next, Math.random()*10);
});

app.stack('1 2 3', app.stack('4 5 6',{wait: true}), {wait: true})();
