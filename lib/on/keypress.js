'use strict';

module.exports = function(runtime){
  var self = runtime;
  runtime.input.removeAllListeners('keypress');
  runtime.input.on('keypress', onKeypress);
  function onKeypress(s, key){
    runtime.key = key;
    if( key && key.ctrl && key.name === 'c'){
      process.stdout.write('\n');
      self.close();
      process.exit(0);
    } else {
      self._ttyWrite(s, key);
    }
  }
  return this;
};
