'use strict';

module.exports = function onWireReadline(line){
  var argv = this.lexer(line);
  var args = this.parser(line);
  var completion = completionHelper(this, line);

  if( completion.indexOf(argv[0]) > -1 ){
    this.emit('next', argv, args);
  } else {
    this.emit('message', {
       prompt : true,
      quotify : 'yellow',
      message : 'command `'+argv[0]+'` not found'
    });
  }
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


