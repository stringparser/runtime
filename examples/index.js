'use strict';

var Runtime = require('../.');
var Promise = require('es6-promise').Promise;

var runtime = Runtime.create({
  onHandle: function(site, index, stack){
    var props = stack.props[index];
    var name = props.name || 'anonymous';

    if(!props.time){
      console.log('`%s` started', name);
      props.time = process.hrtime();
    } else {
      var diff = process.hrtime(props.time);
      console.log('`%s` ended after %s ms',
        name, diff[1]*1e-6
      );
    }
  },
  onHandleError: function(error){
    console.log('ups something broke');
    throw error;
  },
  reduceStack: function(stack, site){
    if(typeof site === 'function'){
      stack.push(site);
      stack.props = stack.props || [];
      stack.props.push({name: site.name});
    }

    return stack;
  }
});

function foo(next, value){
  console.log('received `%s`', value);
  setTimeout(function(){
    next(null, 'Callback');
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
console.log(
  'Stack tree -> %s',
  require('archy')(composed.stack.tree())
);
