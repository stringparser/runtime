
/*
 * Module dependencies
 */

var util = require('./utils');
var Command = require('./command/constructor');
var xInterface = require('./command/interface');

var merge = util.merge;

/*
 *
 */

exports = module.exports = {};

/*
 *
 */

function Runtime(name){

  if(!name){
    throw new Error(' A `Runtime` instance need a name (string).');
  }
  else if(typeof name !== 'string'){
    throw new Error(' Runtime\'s instance name should be a `string`');
  }

  if ( !(this instanceof Runtime) ){
    return new Runtime(name);
  }

  // default properties
  this._name = name;
  this.timer = {};
  this.config = {
    nested : true
  };

  // default functions
  this.parser = require('./command/parser');
  this.terminal = require('./command/terminal');
  this.consumer = require('./command/consumer');
  this.completer = require('./command/completer');
  this.interpreter = require('./command/interpreter');

  // setup the runtime's namespace
  Command.setRoot(name);

  function runtime(config){

    if(!util.isObject(config))
      merge(runtime.config, config);

    return runtime;
  };

  merge(runtime, this);

  // inform the interface of the changes
  xInterface.setRuntime(runtime);

  return runtime;
}
exports.Runtime = Runtime;

/*
 *
 */

Runtime.prototype.set = function(name, handle){

  return (
    new Command(this._name, this.config)
  ).set(name, handle);
};

/*
 *
 */

Runtime.prototype.get = function(/* arguments */){

  var args = Array.isArray(arguments[0]);
      args = args ? arguments[0] : [].slice.call(arguments);

  return (
    new Command(this._name, this.config)
  ).get(args);
};

/*
 *  Proxy some readline's Interface methods
 */
var methods = ['prompt', 'setPrompt'];
var handle = xInterface.getInterface();

methods.forEach(function(method){

  Runtime.prototype[method] = function(/* arguments */){
    handle[method].apply(handle, [].slice.call(arguments));
  };

});

Runtime.prototype.done = function(/* arguments */){

  var args = ([].slice.call(arguments)).unshift('done');

  handle.emit.apply(handle, args);
}


/*
 * Order the prototype by key length
 * just to be nicer to `console.log`s
 */
var unOrdered = Runtime.prototype;
var ordered = {};
var keys = Object.keys(Runtime.prototype)

keys.sort(function(key, next){
  return key.length-next.length;
}).forEach(function(method){
  ordered[method] = unOrdered[method];
});

Runtime.prototype = ordered;