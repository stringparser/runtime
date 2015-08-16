'use strict';

var util = require('./lib/util');
var Stack = require('./lib/Stack');

exports = module.exports = Runtime;

/**
 Missing docs
**/
function Runtime(props){
  if(!(this instanceof Runtime)){
    return new Runtime(props);
  }

  util.merge(this, util.type(props).plainObject);
}

/**
 Missing docs
**/
Runtime.Stack = Stack;
Runtime.create = function create(props){ return new Runtime(props); };
Runtime.createClass = util.classFactory(Runtime);

/**
  Missing docs
**/
Runtime.prototype.Stack = Stack;
Runtime.prototype.onHandle = function(){ };
Runtime.prototype.onHandleError = function(err){ throw err; };

/**
  Missing docs
**/
Runtime.prototype.stack = function(/* functions... */){
  var fns = arguments;
  var self = this;

  // just so composer is identifiable
  composer.stack = new self.Stack(fns);
  function composer(next, handle, host){
    var stack = new self.Stack(fns, true);
    if(handle === composer){ // we are inside other stack
      stack.host = host;
      stack.args = host.wait ? host.args : host.args.concat();
      stack.callback = next;
    } else {
      stack.host = false;
      stack.args = util.slice(arguments);
      stack.callback = typeof arguments[arguments.length-1] === 'function'
        ? stack.args.pop()
        : self.onHandleError;
    }
    stack.index = 0;
    stack.context = stack.context || self;
    return tick(stack);
  }

  // runs each handle
  function tick(stack){
    var handle = stack[stack.index];
    var args = handle.stack instanceof Stack ? [handle, stack] : stack.args;
    stack.next = ++stack.index < stack.length;

    var next;
    util.asyncDone(function onNext(done){
      next = done;
      args = [next].concat(args);
      next.wait = Boolean(stack.wait) || !stack.next;
      self.onHandle(next, handle, stack);
      var result = handle.apply(stack.context, args);
      if(next.wait){ return result; }
      if(stack.next){ tick(stack); }
      if(stack.host.next){ tick(stack.host); }
      return result;
    }, function onDone(err){
      if(err instanceof Error){
        return stack.callback.call(self, err, handle, stack);
      } else if(next.wait && arguments.length){
        util.mapPush(stack.args, arguments,
          util.type(err).match(/null|undefined|error/) ? 1 : 0
        );
      }

      next.end = true; --stack.index;
      stack.splice(stack.indexOf(handle), 1);
      self.onHandle(next, handle, stack);

      if(stack.next){ tick(stack); }
      else if(stack.host.next){ tick(stack.host); }
      else if(!stack.length){
        stack.callback.apply(self, [null].concat(stack.args));
        if(!stack.host){ stack = null; }
      }
    });
  }

  return composer;
};
