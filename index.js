'use strict';

var util = require('./lib/util');
var Stack = require('./lib/Stack');

exports = module.exports = {
  Stack: Stack,
  compose: compose
};

function compose(stack){

  if(stack instanceof Stack){ tick(); } else {
    var start = true;
    var sites = arguments;
    tick.stack = new Stack(sites);
    return tick;
  }

  function tick(arg){
    if(start){ stack = new Stack(sites); }
    var handle = stack.sites[++stack.index];
    if(!handle){ return; }

    if(arguments.length){
      if(arg instanceof Stack){
        stack.host = arg;
        util.map(stack.args, arguments, 1);
      } else {
        util.map(stack.args, arguments);
      }
    }

    util.asyncDone(function onNext(done){
      stack.next = done;
      stack.onHandle.apply(stack, stack.args);
      var result = handle.apply(stack, stack.args);
      if(stack.wait){ return result; }
      if(stack.index < stack.length){ compose(stack); }
      return result;
    }, function onDone(err){
      if(err){ stack.onHandleError.apply(stack, arguments); }
      if(stack.wait && arguments.length > 1){
        util.map(stack.args, arguments, 1);
      }
      stack.queue = stack.queue.replace(stack.siteID(handle), '').trim();
      console.log(handle);
      console.log('stack\n', stack);
      console.log('--');
      stack.onHandle.apply(stack, stack.args);
      if(stack.queue){ compose(stack); }
    });
  }
}
