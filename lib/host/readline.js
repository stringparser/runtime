'use strict';

var util = require('../utils');
var pathlet = null;

module.exports = function readlineHost(runtime, opts){

  var readline = require('readline');
  var onkeypress = require('../on/keypress');

  runtime.input = util.type(opts.input).match(/stream/) || util.through.obj();
  runtime.output = util.type(opts.output).match(/stream/) || util.through.obj();
  runtime.terminal = opts.terminal === void 0 || opts.terminal;

  pathlet = pathlet || [ ];
  runtime.completer = util.type(opts.completer).function
    || function (line, callback){
      var hits = [ ];
      var match = line.match(/[ ]+\S+$|[ ]+$/);
      var completion = util.getCompletion(this, line);

      if( match ){
        util.pathlete(match[0], pathlet);
        line = line.substring(match.index, line.length).trim();
      }

      hits = completion.concat(pathlet).filter(function(elem){
        return elem.indexOf(line) === 0;
      });
      callback(null, [ hits.length ? hits : completion, line ]);
    };

  // host a readline.Interface
  util.merge(runtime, readline.createInterface({
    input: runtime.input,
    output: runtime.output,
    completer: runtime.completer
  }));

  // wire runtime.next
  runtime.on('line', runtime.next);

  // keypress events for a terminal
  if( runtime.terminal ){
    runtime.key = { };
    onkeypress(runtime);
    // the default prompt
    runtime.setPrompt(' '+runtime.store.name+' > ');
  } else { runtime.setPrompt(''); }

  // make some methods chain
  var prompt = runtime.prompt;
  var setPrompt = runtime.setPrompt;

  runtime.prompt = function(/* arguments */){
    prompt.apply(this, arguments);
    return this;
  };

  runtime.setPrompt = function(/* arguments */){
    setPrompt.apply(this, arguments);
    return this;
  };

};
