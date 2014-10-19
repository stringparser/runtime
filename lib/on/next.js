'use strict';

module.exports = function(runtime) {
  runtime.on('next', function(argv, args, next){
    this.consumer(argv, args, next);
  });

  return this;
};
