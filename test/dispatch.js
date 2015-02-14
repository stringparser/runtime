'use strict';
var should = require('should');

module.exports = function(runtime){
  should.exists(runtime);
  var app = runtime.create('dispatch');

  app.set('series', function(next){
    next.wait = true; next();
  });

  app.set('parallel', function(next){
    next.wait = false; next();
  });

  app.set(':handle', function(next){
    setTimeout(next, Math.random()*Number(next.match));
  });
};
