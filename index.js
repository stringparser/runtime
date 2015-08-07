'use strict';

var util = require('./lib/util');
var Runtime = require('./lib/Runtime');

exports = module.exports = util.merge(
  Runtime.prototype.compose.bind(new Runtime()), {
    Stack: require('./lib/Stack'),
    create: create,
    Runtime: Runtime,
  }
);

function create(name, mixin){
  if(create.store[name]){ return create.store[name]; }

  mixin = mixin || name;
  if(typeof name !== 'string'){ name = util.stringID(); }
  return create.store[name] = new Runtime(mixin);
}
create.store = Object.create(null);
