
/*
 * Module dependencies
 */

var proto = require('./proto');
var host = require('./host');
var util = require('./utils');
var Command = require('./command');

var merge = util.merge;
var terminal = host.getInterface();

/*
 * doc holder
 */

exports = module.exports = { };

/*
 * function `create`
 *
 * @param {String} name
 * @return {Runtime} instance
 */

function create(runtimeName){

  /*
   * Closure variables
   */
  var name = util.isString(runtimeName) ? runtimeName : '#root';
  var config = {
      timer : { },
     nested : true,
    startup : true
  };

  Object.defineProperty(config, 'name', {
           value : name,
        writable : false,
      enumerable : false,
    configurable : false
  });

  Object.defineProperty(config, 'scope', {
        enumerable : false,
      configurable : true,
     set : function(scopeValue){
       assert(util.isString(scopeValue));
       this.scope = scopeValue;
     }
  });

  // runtime as a config wrapper
  var runtime = function (config){
    return runtime.config(config);
  };
  var clone = { };
  merge(clone, proto);
  merge(clone, new Command(config));
  merge(clone, host.getDefaults());
  //  ^ -----------------------------
  //  - lexer
  //  - parser
  //  - consumer
  //  - completer

  merge(runtime, clone);
  // hook the instance to `readline`
  host.setRuntime(runtime);

  runtime.setPrompt(' > '+name+' ');

  return runtime;
}
exports.create = create;
