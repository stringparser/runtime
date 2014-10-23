'use strict';

var util = require('../utils');
var debug = util.debug(__filename);

module.exports = function(runtime){
  runtime.on('line', function onLine(_line){
    var line = util.boil(_line).join(' ').trim();
    var argv = this.lexer(line);
    var args = this.parser(line);
    debug('line "'+ line +'"');
    return line ? this.consumer(argv, args) : this.prompt();
  });
  return this;
};
