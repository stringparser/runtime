##### [Documentation][t-docs] - [`module.exports`][t-module] - Runtime API - [Stack API][t-stack-api]

Here is where all the interesting stuff starts to happen.

> Note: on all that follows, `node` refers to an object mapping a string (or path) to an object via regular expressions. Being the `rootNode` that for which
no path was given.

## runtime.stack

Is the main entry point for the [Stack API][t-stack-api], see that document.

## runtime.set
> Sets `nodes` and their properties

_arguments for_ `runtime.set([path, props])`
- `path` type string, to be parsed as a regular expression
- `props` type function or plainObject

_when_
- no `path` is given all properties will be parsed for the `rootNode`
- `props` is a function: is assigned to `props.handle`
- `props` is a plainObject: each property is passed to [a parser][x-runtime-parse] if there is one for it. If there is no parser:
  - When is **not** an object, is cloned and asigned to `node[prop]`
  - When the property is an object, it is cloned and merged with `node[prop]`.

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

## runtime.get
> gives an object matching the given path, cloning it by default

_arguments for_ `runtime.set([path, options, mod])`_
- `path`, type string, to match with those set previously
- `options`, type object, with all extra information
- `mod`, type object. If is a:
  - plainObject with property ref, the node found will not be cloned
  - regular expression, are the props to skip while cloning

_returns_
- the object `node` by reference if `mod.ref` was true
- an object clone using `options` as a holder

_when_
- The `node` has a parent it will inherit its properties while cloning.

_defaults_
- to return a clone of the `rootNode` when no arguments are given

> Note: parent and children properties are made non-enumerable by default so deep cloning is avoided.

## runtime.parse
> parse `node` properties _before_ they are set

The method sets a `parser` for latter usage in [runtime.set][t-runtime-set], being invoked when a property key matches it on runtime set.

_arguments for_ `runtime.set(prop[, parser])`
 - `prop`, type string or object with one function per key
 - `parser`, optional, type `function`

_when_
- `prop` is an object, a parser is expected for each value and each key is taken as a the property that is supposed to parse.

_returns_
 - `parser` for less than two arguments
 - `this` for two arguments

_sample_

_simple property parser_

```js
runtime.parse({
  number: function(node, value, key, props){
    node.number = value + 2;
  },
  string: function(node, value, key, props){
    node.string = value.trim();
  }
});

runtime
   .set({number: 0, string: '  hello'})
   .get(); // =>

{ notFound: true, number: 2, string: 'hello' }

```

_a real world use-case for a parser_
```js
var myLib = require('myLib');
runtime.parse('handle', function(node, value, key, opt){
  var handle = value;
  node.handle = function (/* arguments*/){
    return handle.apply(myLib, arguments);
  }
});
```

### `parser` arguments

Arguments, passed from [manifold.set](#manifoldsetpath-props) to the parser are:
 - `node`, type object, the current `node` being set
 - `value`, type unkown, `options[prop]` of
 - `key`, type string, property `name` being parsed (equal to `prop` at the moment)
 - `opt`, the `options` object of `manifold.set`


#### built-in: `parent` and `children` property parsers

There are [default property parsers defined](./lib/defaultParsers.js). One for `options.parent` and another one for `options.children`. Both work together to help and define inheritance when using [`manifold.get`](#manifoldgetpath-options-mod) _only_ if so specified.


<br>
----
##### [Documentation][t-docs] - `module.exports` - [Runtime API][t-runtime-api] - [Stack API][t-stack-api]

<!--
  x-: is for just a link
  t-: is for doc's toc
-->

[t-docs]: ./readme.md
[t-module]: ./module.md
[t-stack-api]: ./stack-api.md
[t-runtime-api]: ./runtime-api.md

[x-manifold]: http://github.com/stringparser/manifold
[x-runtime-set]: http://github.com/stringparser/manifold
[x-runtime-get]: http://github.com/stringparser/manifold#manifoldgetpath-options-mod
[x-runtime-parse]: http://github.com/stringparser/manifold#manifoldparseprop-parser
