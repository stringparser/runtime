'use strict';

var Runtime = require('./.');
var through = require('through2');
var Promise = require('es6-promise').Promise;

var runtime = Runtime.create({
  onHandle: function(next, handle, stack){
    if(!next.time){
      console.log('`%s` started', handle.name);
    } else {
      var diff = process.hrtime(next.time);
      console.log('`%s` ended after %s ms',
        handle.name || 'anonymous',
        (diff[0]*1e3 + diff[1]*1e-6).toString().match(/\d+\.\d{0,3}/)[0]
      );
    }

    next.time = process.hrtime();
  },
  onHandleError: function(error){
    console.log('ups something broke');
    throw error;
  }
});

function foo(next, value){
  console.log('received `%s`', value);
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

var fs = require('fs');

function baz(next, value){
  var stream = fs.createReadStream(__filename).pipe(
    through(
      function write(chunk, enc, cb){
        this.push(chunk);
        cb();
      },
      function end(cb){
        this.emit('end', value + 'Stream');
        cb();
      }
    )
  );

  return stream;
}

var composed = runtime.stack(foo, bar, baz, {wait: true});

composed('insert args here', function done(err, result){
  if(err){ return this.onHandleError(err); }
  console.log('result: `%s`', result);
});

// how does it look like?
console.log(
  'Stack tree -> %s',
  require('archy')(composed.stack.tree())
);
