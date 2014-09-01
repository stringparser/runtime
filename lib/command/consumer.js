/*
 * Module dependencies
 */
var host = require('../host');
var warning = require('./warning');

/*
 * Module dependencies
 */
module.exports = function defaultConsumer(argv, args, command){

  var root = this.get();
  command = command || this.get(argv);

  if(command.handle){

    var scope  = this.config('scope');
    command.handle.call(
      scope ? require(scope) : this, argv, args
    );

    // ""ñam, ñam, ñam..." consume the arguments
    argv = consume(argv, command.completion);

    if(argv[0]){
      argv = consume(argv, root.completion);
    }
  }


  var completion = command.completion;

  if( completion.indexOf(argv[0]) > 0 ){

    host.getInterface().emit('next',
      argv, args, this.get(argv)
    );
  }
  else if( argv[0] && argv[0][0] !== '-' ){

    warning(' command `'+argv[0]+'` not found');
    this.prompt();
  }
};

/*
 * doc holder
 */
function consume(argv, completion){

  return argv.filter(function(arg){
    if(arg[0] !== '-'){
      return completion.indexOf(arg) === -1;
    } else {
      return true;
    }
  });
}
