'use strict';

var Runtime = require('./.');
var through = require('through2');
var Promise = require('es6-promise').Promise;

var runtime = Runtime.create({
  onHandleError: function(error){
    console.log('ups something broke');
    throw error;
  }
});

function asyncFoo(next, value){
  console.log(value);
  setTimeout(function(){
    next(null, 'Foo');
  }, Math.random()*10);
}

function asyncBar(next, value){
  return new Promise(function(resolve){
    setTimeout(function(){
      resolve(value + 'Promise');
    }, Math.random()*10);
  });
}

function asyncBaz(next, value){
  var stream = through();

  setTimeout(function(){
    stream.end();
  }, Math.random()*10);

  return stream.once('end', function(){
    next(null, value + 'Stream');
  });
}

var asyncBarBaz = runtime.stack(asyncBar, asyncBaz, {wait: true});

runtime.stack(asyncFoo, asyncBarBaz, {wait: true})('insert args here', function(err, result){
  if(err){ return this.onHandleError(err); }
  console.log(result);
});
