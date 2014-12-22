'use strict';

var util = require('../util');

module.exports = function readlineHost(runtime, o){

  var readline = require('readline');

  // host a readline.Interface
  util.merge(runtime, readline.createInterface({
    input: util.type(o.input).match(/stream/) || util.through.obj(),
    output: util.type(o.output).match(/stream/) || util.through.obj(),
    terminal: o.terminal === void 0 || o.terminal,
    completer: util.type(o.completer).function || util.completer,
  }));

  // wire runtime.next
  runtime.on('line', runtime.next());

  // keypress events for a terminal
  if( runtime.terminal ){ terminal(runtime); }
};

function terminal(runtime){
  // clear
  runtime.input.removeAllListeners('keypress');
  // put an event listener
  runtime.input.on('keypress', function (s, key){
    if( key && key.ctrl && key.name === 'c'){
      process.stdout.write('\n');
      runtime.close();
      process.exit(0);
    } else {
      runtime._ttyWrite(s, key);
    }
  });

  // the default prompt
  runtime.setPrompt(' '+runtime.store.name+' > ');

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
}
