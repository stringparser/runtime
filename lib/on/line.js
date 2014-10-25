'use strict';

var util = require('../utils');
var debug = util.debug(__filename);

module.exports = function(runtime){
  runtime.on('line', function onLine(line){
    runtime.emit('next', line);
  });
  runtime.on('next', function(_line){
    var line = util.boil(_line).join(' ').trim();
    var argv = this.lexer(line);
    var args = this.parser(line);
    debug('line "'+ line +'"');
    if( line ){
      this.consumer(argv, args);
    } else if( runtime.output.isTTY ){
      this.prompt();
    }
  });
  return this;
};
