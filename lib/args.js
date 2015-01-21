'use strict';

exports = module.exports = boilArgs;

function boilArgs(args, index){
  index = Number(index) || 0;
  var elem, len = args.length;
  var argv = new Array(len - index); argv.length = 0;

  while(index < len){
    elem = argv[argv.length++] = args[index++];
  }

  return argv;
}
