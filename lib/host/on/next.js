'use strict';

module.exports = function(runtime){
  runtime.on('line', runtime.next());
  return this;
};
