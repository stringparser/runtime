'use strict';

module.exports = function (runtime){
  var self = runtime;
  runtime.on('wire', onWireReadline);
  function onWireReadline(line){
    var argv = self.lexer(line);
    var args = self.parser(line);
    var completion = completionHelper(self, line);

    if( completion.indexOf(argv[0]) > -1 ){
      self.emit('next', argv, args);
    } else {
      self.emit('message', {
         prompt : true,
        quotify : 'yellow',
        message : 'command `'+argv[0]+'` not found'
      });
    }
  }
  return this;
};

/**
 *
 */

function completionHelper(runtime, stems){
  var cmd = runtime.get(stems);
  var anchor = runtime.get(cmd._parent);
  var completion = [ ];
  (cmd.completion || [ ])
    .concat(anchor.completion || [ ]).forEach(function(elem){
      if(completion.indexOf(elem) < 0){
        completion.push(elem);
      }
  });
  return completion;
}


