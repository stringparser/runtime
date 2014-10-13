'use strict';

var util = require('../utils');

module.exports = function onLine(line){
  if( typeof line !== 'string' ){
    throw new util.Error(
      'runtime.on(\'wire\'): '+
      '`line` should be a `string`'
    );
  }

  line = line.trim();
  if( !line ){
    return this.prompt();
  }

  this.emit('wire', line);
};
