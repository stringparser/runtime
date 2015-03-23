##### [Documentation][t-docs] - `module.exports` - [Runtime API][t-runtime-api] - [Stack API][t-stack-api]

## module.exports

The `module.exports` two methods

- `create`: create a Runtime instance
- `Runtime`: a constructor

## create([name, options])

Key-value store for `Runtime` instances so you can use the same code in different modules without needing to do that yourself.

_arguments_
- `name`, type string, a label for the instance
- `options`, type object, options to be passed to the `Runtime` constructor

_defaults_
 - `name` to `#root`
 - `options.log` defaults to `true`

_returns_
 - a new `Runtime` instance if wasn't there stored
 - a previous instance `name` if it did

## Runtime([options])

```js
var Runtime = require('runtime').Runtime;
var runtime = new Runtime(/*[options]*/);
```

_arguments_
 - `options`, type object, are the properties to be set

_returns_
- a runtime instance

_defaults_
- `options.log = true`, type boolean, flags whether to log or not
- `options.name = #root`, type string, label for the instance


_Methods inherited from_ the [Manifold][x-manifold] constructor
- [set(path[, props])][x-runtime-set], set a path-to-regexp with props for lookup
- [get(path[, options])][x-runtime-get], get the object associated to that path
- [parse(prop[, parser])][x-runtime-parse], parse properties before they are set

Click on the links above for their corresponding documentation.


##### [Documentation][t-docs] - `module.exports` - [Runtime API][t-runtime-api] - [Stack API][t-stack-api]

<!--
  x-: is for just a link
  t-: is for doc's toc
-->

[t-docs]: http://github.com/stringparser/runtime/tree/master/docs
[t-module]: http://github.com/stringparser/runtime/tree/master/docs/api/readme.md
[t-runtime-api]: http://github.com/stringparser/runtime/tree/master/docs/api/runtime.md
[t-stack-api]: http://github.com/stringparser/runtime/tree/master/docs/api/stack.md

[x-manifold]: http://github.com/stringparser/manifold
[x-runtime-set]: http://github.com/stringparser/manifold
[x-runtime-get]: http://github.com/stringparser/manifold#manifoldgetpath-options-mod
[x-runtime-parse]: http://github.com/stringparser/manifold#manifoldparseprop-parser
