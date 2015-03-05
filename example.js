'use strict';

var runtime = require('./.');
var should = require('should');
var app = runtime.create('app');

should.exists(app);

app.set(':handle(\\d+)', function(next){
  setTimeout(next, Math.random()*10);
});

app.stack(
  app.stack('1 2 3', {wait: true}),
  '4 5 6',
  {wait: true}
)(1,2,3);
