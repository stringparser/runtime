'use strict';

var util = require('./lib/util');
var Runtime = require('./lib/Runtime');

/**
# Documentation

The `module.exports` a constructor function.

```js
var Runtime = require('runtime');
var runtime = Runtime.create()
```

function async(next){
  // do async things
  // return a stream, promise, RxJS observable or use the `next` callback
}
*/

exports = module.exports = Runtime;

/**
 ## Runtime.create
```js
function create(Object props)
```

Same as `new Runtime`, added to the API just for convenience.

_arguments_
 - `props`, type object, properties to merge with the new instance

_returns_ a `Runtime` instance
**/
exports.create = function create (props) {
  return new Runtime(props);
};

/**
## Runtime.createClass
```js
function createClass(Object mixin)
```

Create a new class that extends the Runtime constructor. As `create`, it was added to the API for convenience. The constructor function return also has a  `createClass` method so inheritance can be built upon.

_arguments_
 - `mixin`, type object that extends the Runtime prototype

_returns_ a constructor function that inherits from `Runtime`
**/
exports.createClass = util.classFactory(Runtime);
