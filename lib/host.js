
/*
 * Module dependencies
 */

var util = require('./utils');
var readline = require('readline');

/*
 * The default `Runtime` handlers
 */

/*
 * the runtime interface
 */

var host = { };

host.start = function(runtime){

  var self = new readline.Interface({
        input : process.stdin,
       output : process.stdout,
    completer : function(line){
      return getRuntime().completer(line);
    }
  });

  self.setPrompt(' > '+runtime.config('name')+' ');

  self.input._events.keypress = function(s, key){

    if(key && key.ctrl && key.name === 'c'){
      process.exit(0);
    } else {
      host._ttyWrite(s, key);
    }
  };

  util.merge(getRuntime(), {
    lexer : require('./command/lexer'),
    parser : require('./command/parser'),
    consumer : require('./command/consumer'),
    completer : require('./command/completer')
  });

  self.on('done', function(line, args, index){
    this.prompt();
  });

  self.on('next', function(argv, args, command){
    getRuntime().consumer(argv, args, command);
  });

  self.on('line', function(line){
    line = line.trim();
    if(line === ''){
      this.emit('done');
    }
    else {

      var runtime = getRuntime();
      var argv = runtime.lexer(line);
      var args = runtime.parser(line);

      this.emit('next', argv, args);
    }
  });



};


/*
 * Module exports
 */

exports = module.exports;

/*
 *
 */

function getInterface(){
  return host;
}
exports.getInterface = getInterface;

/*
 *
 */

var setRuntime = exports.setRuntime = function (handle){

  if( handle === void 0 ){
    throw new util.Error(
      'host.setRuntime: Provide a handle to set.'
    );
  }
  else
    host.start(runtime);
};

var getRuntime = exports.getRuntime = function(){
  return runtime;
};
