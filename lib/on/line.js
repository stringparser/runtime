'use strict';

var util = require('../utils');
var debug = util.debug(__filename);

module.exports = function(runtime){
  runtime.on('line', function onLine(line){
    if( typeof line !== 'string' ){
      throw new util.Error('`line` should be a `string`');
    }
    line = line.trim();
    if( !line ){
      return this.prompt();
    }

    var self = this;
    var argv = this.lexer(line);
    var args = this.parser(line);
    var cmd = this.get(argv);

    var valid = completionHelper(this, argv);
    this.emit('next', argv, args, next);
    function next(_argv, _args){
      var isValid = valid.indexOf(cmd._name) > -1 && !!_argv.length;
      if( !isValid ){ return isValid; }
      _argv = _argv.slice(_argv.indexOf(cmd._name) + 1);
      cmd = self.get(_argv);
      valid = completionHelper(self, _argv);
      self.emit('next', _argv, _args, next);
      return isValid;
    }
  });
  return this;
};

function completionHelper(runtime, stems){
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
}
