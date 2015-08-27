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

function foo(next, value){
  console.log(value);
  setTimeout(function(){
    next(null, 'Foo');
  }, Math.random()*10);
}

function bar(next, value){
  return new Promise(function(resolve){
    setTimeout(function(){
      resolve(value + 'Promise');
    }, Math.random()*10);
  });
}

function baz(next, value){
  var stream = through();

  setTimeout(function(){
    stream.end();
  }, Math.random()*10);

  return stream.once('end', function(){
    next(null, value + 'Stream');
  });
}

var barBaz = runtime.stack(bar, baz, {wait: true});

var composed = runtime.stack(foo, barBaz, {wait: true});

composed('insert args here',
  function (err, result){
    if(err){ return this.onHandleError(err); }
    console.log(result);
  }
);

console.log(require('archy')(composed.stack.tree()));
