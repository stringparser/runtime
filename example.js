'use strict';

var runtime = require('./.');
var should = require('should');
var app = runtime.create('app');

should.exists(app);

app.set('series', function(next){
  next.wait = true; next();
});

app.set(':handle(\\d+)', function(next){
  setTimeout(next, Math.random()*10);
});

app.stack('series 1 2 3')(1,2,3);
