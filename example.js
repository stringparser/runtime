'use strict';

var runtime = require('./.').create();

function one(next){
  var stack = this;
  console.log('one start\n', stack);
  setTimeout(function(){
    console.log('one end\n', stack);
    next(null, 3, 4);
  }, 1000);
}

function two(next){
  console.log('two start', this);
  next();
  console.log('two end', this);
}

runtime.compose(one, two, function(next){ next(); },
  runtime.compose(one, two, {wait: true}))(1, 2, 3);
