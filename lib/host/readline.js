'use strict';

var pathlet = [ ];

module.exports = function readlineHost(runtime, opts){

  var on = require('./on');
  var util = require('../utils');
  var readline = require('readline');

  runtime.input = util.type(opts.input).match(/stream/)
    || util.through.obj();
  runtime.output = util.type(opts.output).match(/stream/)
    || util.through.obj();

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

  // create the readlineHost
  util.merge(runtime,
    readline.createInterface(runtime.input, runtime.output, runtime.completer));

  // wire the 'next' event
  on.next(runtime);

  if( runtime.terminal ){
    runtime.key = { };
    on.keypress(runtime);
    // the default prompt
    runtime.setPrompt(' > ');
  } else { runtime.setPrompt(''); }

  // make some methods chainable
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
