'use strict';

var util = require('../utils');

module.exports = function(runtime){
  var self = runtime;
  runtime.on('line', onLine);
  function onLine(line){
    if( typeof line !== 'string' ){
      throw new util.Error(
        'runtime.on(\'wire\'): '+
        '`line` should be a `string`'
      );
    }
    line = line.trim();
    if( !line ){ return self.prompt(); }
    self.emit('wire', line);
  }
  return this;
};
