'use strict';

exports = module.exports = utilArgs;

// converts arguments to array
//
function utilArgs(args, index){
  index = Number(index) || 0;
  var len = args.length;
  var argv = new Array(len - index);
  argv.length = 0;
  while(index < len){
    argv[argv.length++] = args[index++];
  }
  return argv;
}

// maps and/or augment array from the given index of another
//
utilArgs.map = function utilArgsMap(argv, args, index){
  var argvLen = argv.length;
  var argsLen = args.length;

  var pos = 0;
  index = Number(index) || 0;
  while(index < argsLen){
    if(index < argvLen){
      argv[pos++] = args[index++];
    } else {
      argv.push(args[index++]);
    }
  }

  return argv;
};
