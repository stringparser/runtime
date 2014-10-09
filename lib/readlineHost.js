'use strict';

var path = require('path');
var util = require('./utils');
var findit = require('findit');

exports = module.exports = readlineHost;

function readlineHost(runtime){

  var host = require('readline').createInterface({
        input : process.stdin,
       output : process.stdout,
    completer : function(line){
      return runtime.completer(line);
    }
  });

  host.input._events.keypress = function(s, key){

    if(key && key.ctrl && key.name === 'c'){
      process.stdout.write('\n');
      process.exit(0);
    } else {
      host._ttyWrite(s, key);
    }
  };

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

    if( typeof line !== 'string' ){
      throw new util.Error(
        'runtime.on("wire", function(line){ /* ... */}): '+
        'line should be a `string`'
      );
    }

    line = line.trim();
    if( !line ){
      return this.prompt();
    }

    var argv = this.lexer(line);
    var args = this.parser(line);

    if( this.completion(line).indexOf(argv[0]) > -1 ){
      this.emit('next', argv, args);
    } else {
      this.emit('message', {
         prompt : true,
        quotify : 'yellow',
        message : 'command `'+argv[0]+'` not found'
      });
    }

  });

  runtime.on('next', function(argv, args, command){
    this.consumer(argv, args, command);
  });

  /**
   * host-specific runtime functions
   */

  runtime.prompt = function(preserveCursor){
    host.prompt(preserveCursor);
    return this;
  };

  runtime.setPrompt = function(text, len){
    host.setPrompt(text, len || text.length);
    return this;
  };

  host.setPrompt(' > '+runtime.config('name')+' ');
}

var completion = [ ];
findit('.').on('path', function(file){

  var test = (/^.git|node_modules|^\./i).test(file);
      test = !test && !(/^test/i).test(file);

  if( test && path.extname(file).match(/\.(js|coffee)/) ){
    completion.push(file);
  }
});
