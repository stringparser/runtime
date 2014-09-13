
/*
 * Module dependencies
 */

var util = require('./utils');

exports = module.exports = { };
exports.attach = attach;

/**
 * function `createHost`
 */

function attach(runtime){

  /**
   * default host is readline
   */

  util.merge(runtime, {
    lexer : require('./command/lexer'),
    parser : require('./command/parser'),
    consumer : require('./command/consumer'),
    completer : require('./command/completer')
  });

  var host = require('readline').createInterface({
        input : process.stdin,
       output : process.stdout,
    completer : runtime.completer
  });

  host.input._events.keypress = function(s, key){

    if(key && key.ctrl && key.name === 'c'){
      process.exit(0);
    } else {
      host._ttyWrite(s, key);
    }
  };

  /**
   * path completion
   */

  var completion = [ ];
  var finder = require('findit')('.');

  finder.on('path', function(file, stat){

    var test = (/^.git|node_modules|^\./i).test(file);
        test = !test && (/(\.(js|coffee)$)/i).test(file);

    if( test ){
      completion.push(file);
    }
  });

  finder.on('end', function(){
    runtime.config({
      completion : completion
    });
  });

  /**
   * host events
   */

  host.on('line', function(line){
    runtime.emit('wire', line);
  });

  /**
   * runtime events
   *
   * `wire` is the main runtime event
   */

  runtime.on('wire', function(line){
    line = line.trim();
    if(line === ''){
      this.emit('done');
      return ;
    }

    var cmd = this.get(line);
    var argv = runtime.lexer(line);
    var args = runtime.parser(line);

    if( cmd._name === argv[0] )
      this.emit('next', argv, args);
    else
      this.emit('notFound', argv, args);

  });

  runtime.on('next', function(argv, args, command){
    this.consumer(argv, args, command);
  });

  runtime.on('done', function(){
    this.prompt();
  });

  runtime.on('notFound', function(argv, args){
    console.log(' runtime: command `'+argv[0]+'` not found');
    this.prompt();
  });

  runtime.on('startup', function(){
    this.prompt();
  });

  /**
   * host-specific runtime functions
   */

  runtime.prompt = function(){
    host.prompt();
  };

  runtime.setPropmt = function(text, len){
    host.setPrompt(text, len || text.length);
  };

  runtime.write = function(/*arguments*/){
    host.write.apply(host, arguments);
  };

  host.setPrompt(' > '+runtime.config('name')+' ');

  runtime.emit('startup');

  return runtime;
}
