'use strict';

var runtime = require('./.').create({
  onHandle: function(){
    console.log('onHandle');
    console.log(arguments);
    console.log('--');
  }
});

function one(next){
  setTimeout(function(){
    next(null, 3, 4);
  }, 1000);
}

function two(next){
  next();
}

runtime.stack(one, two, function(next){ console.log('anonymous'); next(); },
  runtime.stack(one, two, {wait: true}))(1, 2, function end(){
    console.log('ended!');
    console.log(arguments);
  });
