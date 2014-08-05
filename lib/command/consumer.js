
var xInterface = require('./interface');

module.exports = function defaultConsumer(command, argv, args){

  console.log('\n Consumers says: "ñam, ñam, ñam! ... "\n  ')
  console.log('\n   argv = ', argv, '\n')
  console.log('  chewing = \n',command);
  argv = argv.splice(command._depth);
  console.log('\n   argv = ', argv, '\n')

  return argv;
}