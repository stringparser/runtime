'use strict';

var util = require('./lib/util');
var Stack = require('./lib/stack');
var Runtime = require('./lib/runtime');

/* ## top-level API

- create: create a Runtime instance
- Runtime: the runtime constructor
*/

exports = module.exports = {
  Runtime: Runtime,
  create: create,
  Stack: Stack
};

/*
## create([name, options])

Key-value store for `Runtime` instances.

_arguments_
- `name` type string, label for the instance
- `options` type object, options to be passed to the `Runtime` constructor

_defaults_
 - `name` to `#root`
 - `options.log` defaults to `true`

_returns_
 - a new `Runtime` instance if wasn't there stored
 - a previous instance `name` if it did
*/

function create(name, o){
  o = o || {};
  o.name = util.type(name || o.name).string || '#root';
  if(!create.cache[o.name]){
    create.cache[o.name] = new Runtime(o);
  }
  return create.cache[o.name];
}
create.cache = {};
