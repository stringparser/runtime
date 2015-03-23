'use strict';

var app = require('../../.').create();

function a(next){
  setTimeout(next, Math.random()*10);
}

function b(next){
  setTimeout(next, Math.random()*10);
}

function c(next){
  setTimeout(next, Math.random()*10);
}

function d(next){
  setTimeout(next, Math.random()*10);
}

function e(next){
  setTimeout(next, Math.random()*10);
}

function f(next){
  setTimeout(next, Math.random()*10);
}

var tick = app.stack(a, b, c);
var tack = app.stack(d, e, f, {wait: true});
var teck = app.stack(tick, tack);
var tock = app.stack(tick, tack, {wait: true});

tick();

setTimeout(function(){
  console.log('\ntick should be done, starting tack\n');
  setTimeout(function(){
    tack();
    setTimeout(function(){
      console.log('\ntack have be done, starting teck\n');
      teck();
      setTimeout(function(){
        console.log('\nteck should be done, starting tock\n');
        setTimeout(tock, 1000);
      }, 1000);
    }, 1000);
  }, 1000);
}, 1000);
