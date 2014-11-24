'use strict';

var util = require('../utils');
var debug = util.debug(__filename);

module.exports = function(runtime){
  runtime.on('line', function onLine(line){
    runtime.emit('next', line);
  });
  runtime.on('next', function onNext(/* arguments */){
    var args = util.type(arguments[0]).arguments || arguments;
    var line = util.boil(args[0]).join(' ').trim();
    var ctx = {
       input : line.split(/[ ]+/),
        argv : this.lexer(line),
      params : this.parser(line)
    };
    debug('line "'+ line +'"');
    this.consumer(ctx, [].slice.call(args, 1));
  });
  return this;
};
