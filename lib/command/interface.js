
/*
 * Module dependencies
 */

var readline = require('readline');
var util = require('../utils');

/*
 *
 */

var xInterface = new readline.Interface({
      input : process.stdin,
     output : process.stdout,
  completer : function(line){

    if(!runtime){
      return xRuntime.completer(line);
    }
    else{
      return runtime.completer(line);
    }
  }
})

/*
 *
 */

xInterface.on('line', function(line){

  line = line.trim();
  if(line === '')
    this.emit('done');
  else {

    this.emit('next', line.split(/[ ]+/), xHandle.current.parser(line), 0);
  }
})

/*
 *
 */

xInterface.on('next', function(argv, args, index){

  console.log('\n argv[%d] = %s', index, argv[index]);
  if(argv[index]){

    var handle = xHandle.current;

    handle.terminal.call(handle, argv.slice(index), args,
      function next(){
        xInterface.emit('next', argv, args, index+1);
      }
    );

  }
  else
    this.emit('done', argv[index], args, index);
})

/*
 *
 */

xInterface.on('done', function(line, args, index){

  if(line)
    console.log(' `%s` done\n', JSON.stringify(line));
  else
    console.log(' `` done\n');

  this.prompt();
})

/*
 * The default `Runtime` handle
 */

var xRuntime = {
  _name : 'default',
  _parent : 'default',
  parser : require('./parser'),
  terminal : require('./terminal'),
  completer : require('./completer'),
  config : {
    override : true
  }
}

/*
 * Module exports
 */

exports = module.exports = {};

/*
 *
 */

exports.getInterface = function(name){

  if(!name)
    return xInterface;
  else
    return xInterface[name];
}

/*
 *
 */

var runtime;
exports.setHandle = function(handle){
  runtime = handle;
}

/*
 *
 */

exports.config = function(source){

  if(Array.isArray(source))      return ;
  else if( source instanceof RegExp ) return ;
  else if(typeof source === 'string') return ;
  else if(typeof source === 'function')
    throw new Error(' Pass an object to the configuration');

  var target = xHandle.config;

  for(var key in source){
    target[key] = source[key];
  }

  xHandle.config = target;

  return target;
}