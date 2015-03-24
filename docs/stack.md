##### [Documentation][t-docs] - [`module.exports`][t-module] - [Runtime API][t-runtime-api] - Stack API

The entry point for the stack API is through `runtime.stack`

## runtime.stack
> construct a consumable stack object which, upon call, will be used to
invoke and give context to its `...arguments`

_arguments_ of `runtime.stack(...arguments[, props])`
- `...arguments`, type string or function:
  - string handlers are get from those set with [`runtime.set(path[, props)]`][x-runtime-set]
  - functions, taken as they are
- `props`, type object, properties of stack (see the [stack API][t-stack-api])

**_throws_**
 - when no arguments are given

_returns_
- a `tick` callback, which, upon call will execute the stack arguments

_depends on_
- [async-done](http://github.com/phated/async-done) which is mainly used to trap errors in a domain and resolve completion for the usual async constructs we have today: _Streams_, _Promises_ and _Observables_. _Callbacks_ are handled separately.

`app.stack` returns a function so it can be composed.

##### [Documentation][t-docs] - `module.exports` - [Runtime API][t-runtime-api] - [Stack API][t-stack-api]

<!--
  x-: is for just a link
  t-: is for doc's toc
-->

[t-docs]: http://github.com/stringparser/runtime/tree/master/docs

[t-module]: http://github.com/stringparser/runtime/tree/master/docs/api/readme.md

[t-stack-api]: http://github.com/stringparser/runtime/tree/master/docs/api/stack.md

[t-runtime-api]: http://github.com/stringparser/runtime/tree/master/docs/api/runtime.md
[t-runtime-api-stack]: http://github.com/stringparser/runtime/tree/master/docs/api/runtime.md#stack
