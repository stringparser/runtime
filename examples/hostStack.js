'use strict';

var Runtime = require('../.');

var runtime = Runtime.create({
  onHandle: function(site, index, stack){
    var props = this.props[index];

    if(!this.time && !props.host){
      console.log(' start ->', this.tree().label);
      this.time = process.hrtime();
    } else if(!props.time && props.host){
      console.log('start ->', props.host.tree().label);
    }

    if(props.site){
      console.log(props.time ? ' ended' : ' start',
        props.site.name
      );
    }

    if(props.host && props.host.end){
      console.log('ended ->', props.host.tree().label);
    } else if(this.end && !props.host){
      console.log(' ended ->', this.tree().label);
    }
    props.time = process.hrtime();
  },
  reduceStack: function(stack, site){
    if(typeof site !== 'function'){ return stack; }

    stack.push(site);
    stack.props = stack.props || [];
    if(site.stack instanceof this.Stack){
      stack.props.push({host: stack});
    } else {
      stack.props.push({site: site});
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
