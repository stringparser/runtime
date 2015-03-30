##### [Documentation][t-docs] - [`module.exports`][t-module] - [Tornado API][t-tornado] - Stack API

### Stack API

* [Stack methods](#stack-methods)
* [Stack properties](#stack-properties)
* [Stack entry points](#stack-entry-points)
* [Stacks composition](#composing-stacks)

Stack istances are created internally when [`tornado.stack`][t-tornado-stack] is used. Each instance gives context the elements of the stack and is accessible in any of them at `this`.

The first instance created in [`tornado.stack`][t-tornado-stack] is attached to function returned by it with only one string property: `path`. This property is mainly used logging. Full stack instances are created when the function is invoked for the first time.

> Note: on all that follows, `node` refers to an object mapping from a  string (or path) via regular expressions. Being the `rootNode` that for which no path was given.

## Stack methods

### stack.onHandleError
```js
function onHandleError(Error error, function next)
```

Called when:
 - whenever an error occurs
 - the first argument of the function returned by `tornado.stack` is an error
 - the `next` callback passed to each element of the stack is called with a 1st argument that is not null

_arguments_
 - `error` type Error, passed to the stack
 - `next` type function, callback passed to any of the functions of the stack

_defaults_
 - to a function that throws the error

### stack.onHandleNotFound
```js
function onHandleNotFound(next, ...stackArguments)
```

Mainly used for missing function associated with a string to object mappings when [`tornado.get`][t-tornado-get] is called.

Called when:
- whenever the handle wasn't found

_arguments_
- `next` type function, callback passed to any of the functions of the stack
- `stackArguments` type unknown, arguments passed down the stack

_defaults_
- to a function throwing an error if `tornado.repl` is not active
- to a function that prints a warning when `tornado.repl` is active

### stack.onHandleCall
```js
function onHandleCall(function next, ...stackArguments)
```

Called just before a handle is run. The arguments are the same passed to the corresponding handle afterwards.

_arguments_
 - `next` type function, callback passed to any of the functions of the stack
 - `stackArguments` type unknown, arguments passed down the stack

_defaults_
 - to an empty function

### stack.onHandleEnd
```js
function onHandleEnd(function next, ...stackArguments)
```

Called when `next` was called from the previous function of the stack. Or when the a stream, promise, observable is done (see [async-done][m-async-done]). The arguments are the same passed to the corresponding handle afterwards.

_arguments_
 - `next` type function, callback passed to any of the functions of the stack
 - `stackArguments` type unknown, arguments passed down the stack

_defaults_
 - to an empty function

### stack.onHandle
```js
function onHandle(function next, ...stackArguments)
```

Called just before `onHandleCall` and before `onHandleEnd`.

_arguments_
 - `next` type function, callback passed to any of the functions of the stack
 - `stackArguments` type unknown, arguments passed down the stack

_defaults_
 - to a logger if the `rootNode` has a property `log` set to true

## Stack properties

The only thing that is shared between stacks are their arguments, so properties can be safely attached to them and used without side effects.

Special properties are
 - `wait`: makes the next handle to wait for this to finish.

## Stack entry points

There are two entry points for the Stack API:
- through [tornado.set][t-tornado-set]
- through [tornado.stack][t-tornado-stack]

### Through tornado.stack
```js
function stack(...arguments[, object props])
```
The props object will become part of the stack properties, overriding methods of the prototype.

```js
function one(){}
function two(){}
function three(){}

app.stack(one, two, three, {
 onHandleCall: function(next){

 },
 onHandleError: function(next){

 },
 onHandleEnd: function(next){

 }
});
```
### Through tornado.set
```js
function set(path[, object props])
```
When returned function from `tornado.stack` is called for the first time, if the first argument is string or the first function has a property `path` that is a string an object `node` is obtained and its properties are attached to the stack `instance`

```js
var app = require('tornado').create();

app.set('get /profile/:url', function(next){

 next();
});

function end(){
 console.log('url was', this.params.url);
};

app.stack('get /profile/page', end)()
// =>
// url was page
```

## Stack composition

[`tornado.stack`][t-tornado-stack] returns a function so its possible to compose one stack with another. As is was said earlier in this same document, each stack only shares the arguments passed with another.

```js
var app = require('tornado').create();

app.set(':handle(\\d+)', function(next){
  setTimeout(next, Math.random());
});

app.stack('1 2 3', app.stack('4 5 6', app.stack('7 8 9')))();
```

##### [Documentation][t-docs] - [`module.exports`][t-module] - [Tornado API][t-tornado] - Stack API

<!--
  b-: is for badges
  t-: is for doc's toc
  x-: is for just a link
-->

[t-docs]: ./readme.md
[t-stack]: ./stack.md
[t-module]: ./module.md
[t-tornado]: ./tornado.md
[t-tornado-set]: ./tornado.md#tornadoset
[t-tornado-get]: ./tornado.md#tornadoget
[t-tornado-parse]: ./tornado.md#tornadoparse
[t-tornado-stack]: ./tornado.md#tornadostack
