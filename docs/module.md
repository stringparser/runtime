##### [Documentation][t-docs] - `module.exports` - [Runtime API][t-runtime] - [Stack API][t-stack]

## module.exports

The `module.exports` three properties

- `Runtime`: class representing a runtime Interface
- `create`: key-value store for `Runtime` instances
- `Stack`: class for consumable stack instances

> Note: on all that follows, `node` refers to an object mapping from a  string (or path) via regular expressions. Being the `rootNode` that for which no path was given.

## Runtime

```js
function Runtime([object options])
```

Class representing a `runtime` Interface.

_arguments_
 - `options` type object, properties to set for the `rootNode` of that instance

_returns_
 - a runtime instance

_defaults_
- `options.log = true`, type boolean, flags whether to log or not
- `options.name = #root`, type string, label for the instance

_Inherits from_ the [Manifold][x-manifold] class making it a key-value store that can map strings to objects via regular expressions. The store starts with a `rootNode` at `instance.store` and builds up all its children at `instance.store.children` in a flat manner.

For more information about runtime `nodes` see the [Runtime API](./runtime.md).

## create

```js
function create([name, object options])
```

Key-value store for `Runtime` instances.

_arguments_
- `options` type object, options to be passed to the `Runtime` constructor

_defaults_
 - `options.name` to `#root`
 - `options.log` defaults to `true`

_returns_
 - a new `Runtime` instance if was stored
 - a previously stored `options.name` instance

## Stack
```js
function Stack(array|arguments args [, Runtime app])
```
Class for consumable stack instances

_arguments_
- `app` a runtime instance
- `args` type arguments or array, each element should be a string or function

_returns_
- a stack instance

For more details, read about the [stack API][t-stack].

<br>
---
##### [Documentation][t-docs] - `module.exports` - [Runtime API][t-runtime] - [Stack API][t-stack]

<!--
  x-: is for just a link
  t-: is for doc's toc
-->

[t-docs]: ./readme.md
[t-stack]: ./stack.md
[t-module]: ./module.md
[t-runtime]: ./runtime.md

[x-manifold]: http://github.com/stringparser/manifold
[x-runtime-set]: http://github.com/stringparser/manifold
[x-runtime-get]: http://github.com/stringparser/manifold#manifoldgetpath-options-mod
[x-runtime-parse]: http://github.com/stringparser/manifold#manifoldparseprop-parser
