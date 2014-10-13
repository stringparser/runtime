'use strict';

var self;
module.exports = function onNext(argv, args){
  self = this;
  this.consumer(argv, args, next);

};

function next(argv, args){
  if( !argv[0] ){ return ; }
  self.emit('next', argv, args);
}
