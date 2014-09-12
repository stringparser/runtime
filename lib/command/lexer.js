

/*
 * Prepare the arguments for the consumer
 *   - Strip all flag params i.e. numbers and "=something"
 */

var debug = require('debug')('cmd:lexer');

module.exports = function defaultLexer(line){

  var cmd = line.replace(/(\d+|=\S+)/g, '')
                .match(/\S+/g);

  debug('cmd', cmd);
  // cmd = cmd.replace(/[ ]+-{1,}\S+/g, '').match(/\S+/g);

  if(cmd !== null)
    return cmd;
  else
    return [ ];
};
