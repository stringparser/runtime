'use strict';

var Runtime = require('../.');
var Promise = require('es6-promise').Promise;

var runtime = Runtime.create({
  reduceStack: function(stack, site){
    if(typeof site === 'function'){
      stack.push({
        fn: site,
        label: site.stack instanceof Runtime
          ? site.stack.tree().label
          : site.name
      });
    }
  },
  onHandle: function(site, stack){
    if(!site.time){
      console.log('`%s` started', site.label);
      site.time = process.hrtime();
    } else {
      var diff = process.hrtime(site.time);
      console.log('`%s` ended after %s ms',
        site.label, diff[0]*1e+3 + Math.floor(diff[1]*1e-6)
      );
    }
  },
  onHandleError: function(error){
    console.log('ups something broke');
    throw error;
  }
});

function foo(value, next){
  console.log('received `%s`', value);
  setTimeout(function(){
    next(null, 'Callback');
  }, Math.random()*10);
}

function bar(value, next){
  return new Promise(function(resolve){
    setTimeout(function(){
      resolve(value + 'Promise');
    }, Math.random()*10);
  });
}

var fs = require('fs');
function baz(value, next){
  var stream = fs.createReadStream(__filename);

  return stream.once('end', function(){
    next(null, value + 'Stream');
  });
}

var composed = runtime.stack(foo, bar, baz, {wait: true});

composed('insert args here', function done(err, result){
  if(err){ return this.onHandleError(err); }
  console.log('result: `%s`', result);
});

// how does it look like?
console.log('Stack tree -> %s',
  require('archy')(composed.stack.tree())
);
