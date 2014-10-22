'use strict';

module.exports = function(runtime) {
  runtime.on('next', function(argv, args, cmd){
    this.consumer(argv, args, cmd);
  });

  return this;
};
