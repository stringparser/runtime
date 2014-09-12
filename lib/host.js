
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

var host = module.exports = new readline.Interface({
      input : process.stdin,
     output : process.stdout,
  completer : function(line){
    return getRuntime().completer(line);
  }
});

host.start = function(runtime){

  this.setPrompt(' > '+runtime.config('name')+' ');

  this.input._events.keypress = function(s, key){

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

  this.on('done', function(line, args, index){
    this.prompt();
  });

  this.on('next', function(argv, args, command){
    getRuntime().consumer(argv, args, command);
  });

  this.on('line', function(line){
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
 *
 */

host.setRuntime = function (handle){

  if( handle === void 0 ){
    throw new util.Error(
      'host.setRuntime: Provide a handle to set.'
    );
  }
  else
    this.start(runtime);
};

/*
 *
 */

hot.getRuntime = function(){
  return runtime;
};
