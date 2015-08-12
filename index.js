'use strict';

var util = require('./lib/util');
var Runtime = require('./lib/Runtime');

exports = module.exports = util.merge(
  Runtime.prototype.stack.bind(new Runtime()), {
    Stack: require('./lib/Stack'),
    create: create,
    Runtime: Runtime,
  }
);

function create(name, props){
  if(create.store[name]){ return create.store[name]; }

  props = props || name;
  if(typeof name !== 'string'){ name = util.stringID(); }
  return create.store[name] = new Runtime(props);
}
create.store = {};
