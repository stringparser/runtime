##### [Documentation][t-docs] - [`module.exports`][t-module] - [Runtime API][t-runtime-api] - Stack API

### Stack API

* [Stack methods](#stack-methods)
* [Stack properties](#stack-properties)
* [Stack entry points](#stack-entry-points)
* [Stacks composition](#composing-stacks)

Stack istances are created internally when [`runtime.stack`][t-runtime-stack] is used. Each instance gives context the elements of the stack and is accessible in any of them at `this`.

The first instance created in [`runtime.stack`][t-runtime-stack] is attached to function returned by it with only one string property: `path`. This property is mainly used logging. Full stack instances are created when the function is invoked for the first time.

> Note: on all that follows, `node` refers to an object mapping from a  string (or path) via regular expressions. Being the `rootNode` that for which no path was given.

## Stack methods

### stack.onHandleError
```js
function onHandleError(Error error, function next)
```

Called when:
 - whenever an error occurs
 - the first argument of the function returned by `runtime.stack` is an error
 - the `next` callback passed to each element of the stack is called with a 1st argument that is not null

_arguments_
 - `error` type Error, passed to the stack
 - `next` type function, callback passed to any of the functions of the stack

_defaults_
 - to a function that throws the error

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
- through [runtime.set][t-runtime-set]
- through [runtime.stack][t-runtime-stack]

### Through runtime.stack
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
### Through runtime.set
```js
function set(path[, object props])
```
When returned function from `runtime.stack` is called for the first time, if the first argument is string or the first function has a property `path` that is a string an object `node` is obtained and its properties are attached to the stack `instance`

```js
var app = require('runtime').create();

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

[`runtime.stack`][t-runtime-stack] returns a function so its possible to compose one stack with another. As is was said earlier in this same document, each stack only shares the arguments passed with another.

```js
var app = require('runtime').create();

app.set(':handle(\\d+)', function(next){
  setTimeout(next, Math.random());
});

app.stack('1 2 3', app.stack('4 5 6', app.stack('7 8 9')))();
```

##### [Documentation][t-docs] - [`module.exports`][t-module] - [Runtime API][t-runtime-api] - Stack API

<!--
  b-: is for badges
  p-: is for package
  t-: is for doc's toc
  x-: is for just a link
-->

[t-docs]: ./readme.md
[t-module]: ./module.md
[t-stack-api]: ./stack-api.md
[t-runtime-api]: ./runtime-api.md
[t-runtime-set]: ./runtime-api.md#set
[t-runtime-get]: ./runtime-api.md#get
[t-runtime-parse]: ./runtime-api.md#parse
[t-runtime-stack]: ./runtime-api.md#stack

[p-async-done]: http://npmjs.org/package/async-done
