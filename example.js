'use strict';

var Runtime = require('./.');

function one(stack){
  setTimeout(function(){
    console.log('one');
    stack.next(null, 3, 4);
  }, 1000);
}

function two(stack){
  console.log('two');
  stack.next();
}

Runtime.compose(one, two, Runtime.compose(one, two, {wait: true}))(1, 2, 3);
