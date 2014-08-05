/*
 * Module dependencies
 */
var Warning = require('./warning');
var xInterface = require('./interface');

module.exports = function defaultTerminal(argv, args){

  var command = this.get(argv);

  var nextFired = false;
  if(command.handle){
    command.handle(argv, args, function(){
      nextFired = true;
    });
  }

  argv = this.consumer(command, argv, args);

  console.log('\n followUp = \n', this.get(argv));
  console.log('\n     argv = ', argv, '\n');

  if(this.get(argv)._name === argv[0]){

    xInterface.getInterface().emit('next', argv, args);

  }
  else if ( argv[0] ){

    Warning(' command `'+argv[0]+'` not found');
    xInterface.getInterface().emit('done', argv, args);
  }
  else
    xInterface.getInterface().emit('done', argv, args);

}