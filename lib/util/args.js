'use strict';

exports = module.exports = {};

exports.map = function mapArgs(argv, args, pos){
  var len = args.length;
  if(!len){ return; }

  var top = argv.length;
  pos = Number(pos) || 0;

  var index = 0; --pos;
  while(++pos < len){
    if(pos < top){ argv[++index] = args[pos]; } else {
      argv.push(args[pos]);
    }
  }
};

exports.slice = function sliceArgs(args, index){
  if(!args.length){ return []; }
  index = Number(index) || 0;

  var len = args.length;
  var argv = new Array(len - index);

  var top = -1; --index;
  while(++index < len){
    argv[++top] = args[index];
  }

  return argv;
};
