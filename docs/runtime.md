##### [Documentation][t-docs] - [`module.exports`][t-module] - Runtime API - [Stack API][t-stack]

### Runtime API

Here is where all the interesting stuff starts to happen.

* [runtime.set](#runtimeset)
* [runtime.get](#runtimeget)
* [runtime.stack](#runtimestack)
* [runtime.parse](#runtimeparse)

> Note: on all that follows, `node` refers to an object mapping from a  string (or path) via regular expressions. Being the `rootNode` that for which no path was given.

## runtime.set
```js
function set([string path, object props])
```

_arguments_
- `path` type string to be parsed as a regular expression
- `props` type function or plainObject

_when_
- no `path` is given all properties will be parsed for the `rootNode`
- `props` is a function it is assigned to `props.handle`
- `props` is a plainObject each property is passed to [a parser][t-runtime-parse] if there is one for it. If there is no parser:
  - When is **not** an object, is cloned and assigned to `node[prop]`
  - When the property is an object, it is cloned and merged with `node[prop]`.

_returns_
- this, the runtime instance

`path` is parsed to a regular expression using the  [parth][m-parth] module, which uses the [usual conventions][m-path-to-regex] on for path to regexp parsing. So you know... interesting things can happen.

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
```js
function get([string path, object options, object mod])
```

Obtains an object matching the given path, cloning it by default.

_arguments_
- `path`, type string, to match with paths previously set
- `options`, type object, with with the object `node` found
- `mod`, type plainObject or regular expression
  - when is a regex, property keys matching it will be skipped

**_throws_**
 - when arguments do not match the type

_returns_
- the object `node` by reference when `mod.ref` is true
- the `rootNode` object if path wasn't a string
- a `node` clone using `options` as a holder

If the node has a property parent properties of the parent

sample
```js
app.set('get /profile', {
  picture: function getProfilePicture(){},
  render: function getMarkup(){}
});

app.set('get /profile/:url', {
  parent: 'get /profile',
  handle: function getProfile(){}
});

app.get('get /profile/page'); // =>
{
  notFound: false,
  path: 'get /profile/page',
  url: '/profile/page',
  params: {
    _: ['url'],
    url: 'page'
  },
  picture: [Function: getProfilePicture],
  render: [Function: getMarkup]
}

app.get('get /profile/page', {ref: true}) // =>
{
  notFound: false,
  path: 'get /profile/page',
  handle: [Function: getProfile]
}

app.get('get /profile/page', /path/, {ref: true}) // =>
{
  notFound: false,
  url: '/profile/page',
  handle: [Function: getProfile]
}
```
> Note: `parent` and `children` properties are made non-enumerable by default so deep cloning is avoided.

## runtime.stack
```js
function stack(...arguments[, object props])
```
On first call constructs a consumable stack object which will be used to
invoke and give context to its `...arguments`.

_arguments_
- `...arguments`, type string or function
- `props`, type object, properties of stack of the [stack API][t-stack]. Look at its documentation for more details

_when_
 - an `...arguments` element is a string its handle will be obtained from the corresponding `node` set using [`runtime.get`][t-runtime-get]

**_throws_**
 - when no arguments are given

_returns_
- a `tick` callback, which, upon call will execute the stack arguments

_sample_

```js
app.set(':handle(\\d+)', function handleNumbers(next){
  console.log('number was', next.params.handle);
  setTimeout(next, Math.random()*10);
});

app.get('1'); // =>
{
  notFound: false,
  path: '1',
  handle: [Function: handleNumbers]
}

function end(next){
  console.log('end');
  next();
}

app.stack('1', end, {wait: true})();
// =>
// number was 1
// end

app.stack('1 2', app.stack('3 4', end, {wait: true}), {wait: true})();
// =>
// number was 1
// number was 2
// number was 3
// number was 4
// end

```

## runtime.parse
```js
function parse(string key|object props[, function parser])
```

This method sets a `parser` for latter usage in [runtime.set][t-runtime-set] which will be invoked when a property key matches `prop`.

_arguments_
 - `key`, type string or object with one function per key
 - `parser`, optional, type `function`

_when_
- `key` is an object, it makes the method recursive. Each key is taken as a the property that is supposed to parse and each value its `parser`.

_returns_
 - `this` for two arguments
 - `parser` for less than two arguments

_samples_

_simple property parser_

```js
runtime.parse({
  number: function(node, value, props){
    node.number = value + 2;
  },
  string: function(node, value, props){
    node.string = value.trim();
  }
});

runtime
   .set({number: 0, string: '  hello '})
   .get(); // =>

{
  notFound: true,
  number: 2,
  string: 'hello'
}

```

_real use-case for a parser_
```js
var myLib = require('myLib');
runtime.parse('handle', function(node, value, props){
  var handle = value;
  node.handle = function (/* arguments*/){
    return handle.apply(myLib, arguments);
  }
});
```

### `parser` arguments

The arguments are passed from [runtime.set][t-runtime-set]:
 - `node`, type object, the current `node` being set
 - `value`, type unknown, `props[key]`
 - `props`, the `props` argument of `manifold.set`


#### built-in: `parent` and `children` property parsers

There are [default property parsers defined](./lib/defaultParsers.js). One for `options.parent` and another one for `options.children`. Both work together to help and define inheritance when using [`manifold.get`](#manifoldgetpath-options-mod) _only_ if so specified.


<br>
----
##### [Documentation][t-docs] - [`module.exports`][t-module] - Runtime API - [Stack API][t-stack]

<!--
  x-: is for just a link
  t-: is for doc's toc
-->

[m-parth]: http://github.com/stringparser/parth
[m-async-done]: http://github.com/phated/async-done
[m-path-to-regex]: https://github.com/pillarjs/path-to-regexp

[t-docs]: ./readme.md
[t-stack]: ./stack.md
[t-module]: ./module.md
[t-runtime]: ./runtime.md
[t-runtime-set]: ./runtime.md#set
[t-runtime-get]: ./runtime.md#get
[t-runtime-parse]: ./runtime.md#parse
[t-runtime-stack]: ./runtime.md#stack

[x-manifold]: http://github.com/stringparser/manifold
