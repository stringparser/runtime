'use strict';

module.exports = function(runtime){
  var self = runtime;
  runtime.on('next', function onNext(argv, args){
    self.consumer(argv, args, next);
  });

  function next(argv, args){
    if( !argv[0] ){ return ; }
    self.emit('next', argv, args, next);
  }

  return this;
};
