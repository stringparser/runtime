
/*
 * Module dependencies
 */

var util = require('./utils');

exports = module.exports = createHost;

/**
 * function `createHost`
 */

function createHost(runtime){

  util.merge(runtime, {
    lexer : require('./command/lexer'),
    parser : require('./command/parser'),
    consumer : require('./command/consumer'),
    completer : require('./command/completer')
  });

  var finder = require('findit')('.');

  var completion = [ ];
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

  var host = new require('readline').Interface({
        input : process.stdin,
       output : process.stdout,
    completer : runtime.completer
  });

  host.input._events.keypress = function(s, key){

    if(key && key.ctrl && key.name === 'c'){
      process.exit(0);
    } else {
      exports._ttyWrite(s, key);
    }
  };

  host.on('done', function(line, args, index){
    this.prompt();
  });

  host.on('next', function(argv, args, command){
    runtime.consumer(argv, args, command);
  });

  host.on('line', function(line){
    line = line.trim();
    if(line === ''){
      this.emit('done');
    }
    else {

      var argv = runtime.lexer(line);
      var args = runtime.parser(line);

      this.emit('next', argv, args);
    }
  });

  return host;
}
