'use strict';

exports = module.exports = boilArgs;

function boilArgs(Args, index){
  index = index || 0;
  var len = Args.length;
  var args = new Array(len - index); args.length = 0;
  while(index < len){ args[args.length++] = Args[index++]; }
  return args;
}
