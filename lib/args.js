'use strict';

exports = module.exports = argsUtil;

function argsUtil(args, index){
  index = Number(index) || 0;

  var len = args.length;
  var argv = new Array(len - index);

  argv.length = 0;
  while(index < len){
    argv[argv.length++] = args[index++];
  }

  return argv;
}
