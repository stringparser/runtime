##### [Documentation][t-docs] - [`module.exports`][t-module] - Runtime API - [Stack API][t-stack-api]

## Runtime API

Here is where all the interesting stuff starts to happen.

Methods inherited from the [Manifold][x-manifold] constructor

- [set(path[, props])][x-runtime-set], set a path-to-regexp with props for lookup
- [get(path[, options])][x-runtime-get], get the object associated to that path
- [parse(prop[, parser])][x-runtime-parse], parse properties before they are set

We'll only cover `set` here, you can look at the others on the links above.

**NOTE**: In all of the following `node` refers to an object mapping a regular expression match to an object.

## runtime.set
Sets a path to RegExp mapping between string and object

_arguments of_ `runtime.set(path[, props])`
- `path` type string, to be parsed as a regular expression
- `props` type function or plainObject

_when props is a_
- function: is assigned to the `props.handle`
- plainObject: properties are passed to [a `parser`][x-runtime-parse] if there is one for it and, if not, the property is cloned and merged with that `node.prop` if the property does not exists an empty object is created.

_returns_
 - this, the runtime instance

The path is taken as a regular expression using the  [parth](http://github.com/stringparser/parth) module, which uses the usual conventions on for path to regexp parsing. So you know... interesting things can happen.

### samples

_mapping an object with a regular expression_
```js
var runtime = require('runtime').create();

runtime.set('get /user/:page(\\d+)', function getUserPage(){
  // do stuff
});

runtime.get('get /user/10');
// =>
{
  notFound: false,
  path: 'get /user/10',
  url: '/user/10',
  match: 'get /user/10',
  params: { _: [ 'page' ], page: '10' },
  handle: [Function: getUserPage]
}
```

_simple property parser_
```js
var runtime = require('runtime').create('myBinaryThing');

runtime.parse('number', function(node, number, key, props){
  var num = Number(number);
  if(!Number.isNaN(num)){
    node.number = Number(num.toString(2));
  }
});

runtime.set({number: 5});
runtime.get();
// =>
{
  notFound: true,
  name: 'myBinaryThing',
  number: 101
}
```

#### runtime.stack
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

```js
var app = require('runtime').create();

app.set('get :thing', function getThingHandle(next, one, two, three){
  console.log(this.params.thing);
  console.log(one, two, three);
  next(); /* or return stream, promise or observable */
});

function foo(next){ next(); /* or return stream, promise or observable */ }
function bar(next){ next(); /* or return stream, promise or observable */ }
function baz(next){ next(); /* or return stream, promise or observable */ }

var tick = app.stack('get stuff', foo, app.stack(bar, app.stack(baz)));

tick(1,2,3);
```

By default all the elements of each stack will run in parallel.

----
##### [Documentation][t-docs] - `module.exports` - [Runtime API][t-runtime-api] - [Stack API][t-stack-api]

<!--
  x-: is for just a link
  t-: is for doc's toc
-->

[t-docs]: http://github.com/stringparser/runtime/tree/master/docs
[t-module]: http://github.com/stringparser/runtime/tree/master/docs/api/readme.md
[t-stack-api]: http://github.com/stringparser/runtime/tree/master/docs/api/stack.md
[t-runtime-api]: http://github.com/stringparser/runtime/tree/master/docs/api/runtime.md

[x-manifold]: http://github.com/stringparser/manifold
[x-runtime-set]: http://github.com/stringparser/manifold
[x-runtime-get]: http://github.com/stringparser/manifold#manifoldgetpath-options-mod
[x-runtime-parse]: http://github.com/stringparser/manifold#manifoldparseprop-parser
