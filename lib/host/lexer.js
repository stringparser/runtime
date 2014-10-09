'use strict';

/*
 * Prepare the arguments for the consumer
 *   - Strip all flag params i.e. numbers and "=something"
 */

var debug = require('../utils').debug(__filename);

module.exports = function defaultLexer(line){

  var cmd = line.replace(/(\d+|=\S+)/g, '')
                .split(/[ ]+/);

  debug('cmd', cmd);

  if(cmd !== null){
    return cmd;
  } else {
    return [ ];
  }
};
