
/*
 * Module dependencies
 */

var util = require('./utils');
var readline = require('readline');
var merge = util.merge;

/*
 * The default `Runtime` handlers
 */

var defaultRuntime = {
  lexer : require('./command/lexer'),
  parser : require('./command/parser'),
  consumer : require('./command/consumer'),
  completer : require('./command/completer')
};

/*
 * the runtime interface
 */

var terminal = {
      input : process.stdin,
     output : process.stdout,
  completer : function(line){
    return getRuntime().completer(line);
  }
};

var terminal = new readline.Interface(terminal);

/*
 *
 */

terminal.on('line', function(line){

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

/*
 *
 */

terminal.on('next', function(argv, args, command){
  getRuntime().consumer(argv, args, command);
});

/*
 *
 */

terminal.on('done', function(line, args, index){
  this.prompt();
});

/*
 *
 */

var sawSIGINT = false;
process.on('SIGINT', function(code){

  terminal.output.write(' ( ^C again to quit )\n');

  if(sawSIGINT)
    process.exit(0);

  sawSIGINT = true;

})


/*
 * Module exports
 */

exports = module.exports;

/*
 *
 */

function getInterface(name){

  if(!name)
    return terminal;
  else
    return terminal[name];
}
exports.getInterface = getInterface;

/*
 *
 */

function getDefaults(){

  var target = merge({}, defaultRuntime);
  return target;
}
exports.getDefaults = getDefaults;

/*
 *
 */

var runtime;
function setRuntime(handle){

  if( util.isUndefined(handle) ){
    throw new Error(
      'terminal.setRuntime: Provide a handle to set.'
    );
  }
  else {
    runtime = handle;
  }
}
exports.setRuntime = setRuntime;

/*
 *
 */

function getRuntime(){

  if(util.isUndefined(runtime)){
    var target = merge({}, defaultRuntime);
    return target;
  }
  else {
    return runtime;
  }
}
exports.getRuntime = getRuntime;
