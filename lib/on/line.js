'use strict';

var util = require('../utils');

module.exports = function(runtime){
  runtime.on('line', function onLine(line){
    if( typeof line !== 'string' ){
      throw new util.Error('`line` should be a `string`');
    }
    line = line.trim();
    if( !line ){  return this.prompt();  }

    var argv = this.lexer(line);
    var args = this.parser(line);
    this.emit('next', argv, args);
  });
  return this;
};

/*function completionHelper(runtime, stems){
  var completion = [ ];
  var cmd = runtime.get(stems);
  var anchor = runtime.get(cmd._parent);
  (cmd.completion || [ ])
    .concat(anchor.completion || [ ]).forEach(function(elem){
      if(completion.indexOf(elem) < 0){
        completion.push(elem);
      }
  });
  return completion;
}*/
