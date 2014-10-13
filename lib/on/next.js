'use strict';

module.exports = function onNext(argv, args){
  this.consumer(argv, args, next(this, argv, args));
};

function next(runtime, argv, args){
  runtime.emit('next', argv, args);
}
