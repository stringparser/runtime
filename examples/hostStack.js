'use strict';

var Runtime = require('../.');

var runtime = Runtime.create({
  onHandle: function(site, index, stack){
    var props = stack.props[index];

    if(!stack.time){
      console.log('start ->', stack.tree().label);
      stack.time = process.hrtime();
    } else if(!stack.time && stack.host){
      console.log('start ->', stack.host.tree().label);
    }

    console.log(props.time ? ' ended' : ' start', site.name);

    if(stack.host && stack.host.end){
      console.log('ended ->', stack.host.tree().label);
    } else if(stack.end && !stack.host){
      console.log(' ended ->', stack.tree().label);
    }
    props.time = process.hrtime();
  },
  reduceStack: function(stack, site){
    if(typeof site === 'function'){
      stack.push(site);
      stack.props = stack.props || [];
      stack.props.push({});
    }
    return stack;
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
