'use strict';

var Runtime = require('../.');

var runtime = Runtime.create({
  wait: true,
  onHandle: function(site, stack){

    if(site.fn.stack instanceof Runtime){
      console.log(site.time ? 'ended ->' : 'starting ->', site.label);
    } else {
      console.log(site.time ? ' ended' : ' start', site.label);
    }

    site.time = process.hrtime();
  },
  reduceStack: function(stack, site){
    if(typeof site === 'function'){
      stack.push({
        fn: site,
        label: site.stack instanceof Runtime
          ? site.stack.tree().label
          : site.name
      });
    }
  }
});

function one(next){
  setTimeout(next, 1000*Math.random());
}

function two(next){
  setTimeout(next, 2000*Math.random());
}

function three(next){
  setTimeout(next, 3000*Math.random());
}

var taskOne = runtime.stack(one, two, {wait: true});
var taskTwo = runtime.stack(three);

runtime.stack(taskOne, taskTwo)();
