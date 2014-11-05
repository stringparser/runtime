# runtime API

Contents:

 - [Runtime methods](#runtime-methods)

## package

```js
var pack = require('runtime');
```

### pack.create([name] [, opts])

Create a new `runtime` instance and save it to access it later via `runtime.get`

`name` if given is a  `string` and defaults to `#root`<br>
`opts` if given is an `object` and defaults to
  - opts.input: an object `through2` stream
  - opts.output: an object `through2` stream
  - opts.completer: a completer function (see below)

The most common case is that you could want to create a CLI-REPL thingy for that you can:

```js
var runtime = require('runtime')
  .create('CLI-REPL', process.argv.indexOf('--repl') > -1 || {
     input : process.stdin,
    output : process.stdout
  });

// dispatch
runtime.emit('next', process.argv);
```

More information on the [`next` event](#next-event).

### pack.get([name] [, opts])

`name` and `opts` are the same as in `pack.create`.

Obtain a previously saved `runtime` or if it didn't exist one will be created and returned.

The purpose of this method is to be able to modularize your code as much as you want to. For that, every `runtime` instance is cached in an object when using `create` or `get`.

### pack.Command([opts])

A command constructor.
Its methods are set, get, config and parse. See the them below.

### pack.Runtime([name] [, opts])

Constructor used by `pack.create`.

## Runtime instance

The runtime instance is an event emitter with 2 events and 8 methods
 - Events: next, done
 - Methods: set, get, config, parse, lexer, parser, consumer, completer

### Runtime events

Aside of the [readline.Interface](http://nodejs.org/api/readline.html#readline_class_interface) ones that is.

#### next event

Event emitted at the beginning of consuming/dispatching a command.

Normally you would want to emit it.

```js
runtime.emit('next', 'string or array of commands to dispatch');
```

and this is how the code looks like for the `next event`

```js
runtime.on('next', function onNext(_line){
  var line = util.boil(_line).join(' ').trim();
  var argv = this.lexer(line);
  var args = this.parser(line);
  if( line ){  this.consumer(argv, args);  }
  else {  this.prompt();  }
});
```

For documentation on the [lexer](#runtimelexer), [parser](#runtimeparser) and [completer](#runtimecompleter) click and if you are curious [here is the consumer code](https://github.com/stringparser/runtime/blob/master/lib/runtime.js#L135).



#### done event

Event emitted when the consumer is done. This can happen when:
  - The last handle calls next
  - The command is not defined

You may want to add a listener here before emitting next

```js
runtime.once('done', function(argv, args, next){
  next('second command');
});
runtime.emit('next', 'first command');
```

### Runtime methods

Aside of the [readline.Interface](http://nodejs.org/api/readline.html#readline_class_interface) ones that is.

#### runtime.set([stems] [, opts])

Set a command specified by `stems` and/or properties via `opts`.

- `opts` is an `object` or a `function`.
- `stems` is a space separated string or an `array`.

When `stems` is a space separated string for each non space string a command is created starting from the **root node**.
When `stems` is an array only the first element is taken to create a command and the other elements will be taken as **aliases** of the first command.
When `stems` is not specified all opts will be attached to the root node.
When `opts` is a function will be assigned to a `handle` property on the command.

```js
// NOTE: the examples below are illustrative
// play around to see what object is actually created
runtime.set('command', function commandHandle(){ });
// created the object
// { rootnode :
      {
        children : { command : { handle : [Function: commandHandle] } }
      }
   }
runtime.set(['one', 'step', 'deep']);
// created the object
// { rootnode :
      {  
        children : { one : {/* props here */} },
         aliases : { deep : 'one', step : 'one' }
      }
   }
// either of the following will have the same output
runtime.get('one'); runtime.get('step'); runtime.get('deep');
// => { one : {/* props here */} }
```

#### runtime.get([stems] [, opts])

Get **a copy** of the most similar, previously defined, command specified by `stems`.
When stems is undefined or a command not defined previously `runtime.get` retrieves the rootNode.

- `opts` is an `object`.
- `stems` is a space separated string or an `array`.

A command is an object and has at least 3 properties
 - `_name` : a string with the name of the command
 - `_depth`: an integer representing how far from the root node the command is.
 - `_parent`: a string with the name of the parent for that command. Obviously the root node has no parent.

Examples:

```js
runtime.set(function rootHandle(argv){
  var notACommand = Boolean(this.get(argv)._parent);
  if( notACommand ){
    this.output.write('Command '+arg.join(' ')+'not defined\n');
  }
});

runtime.set('hello', { one : "prop" });
runtime.set('hello world', function worldHandle(){ });

runtime.get('not defined')    // will get the rootNode command
runtime.get('hello world')    // will get the previous `hello world` command
runtime.get('hello whatever') // will get the previous `hello` command
```

The purpose for the method is to have always a command to hang on to since each word/string can be taken both as the name of a command and a parameter for a handle.

#### runtime.lexer

#### runtime.config([obj] [, value])

Keeps a configuration object that could be used by any method.

- `obj` can be an object or a string
- `value` can be anything

To `get` use the first argument as a string.
To `set` use the two arguments or the first as an object.

All arguments are merged.

```js
// set
runtime.config('init', ['config'])
runtime.config({ init : 'config', key : 'value' });
// get
runtime.config();
runtime.config('key')
```

#### runtime.parse(prop, parser)

Compute command properties when they are set.

`prop` is a string
`parser` is a function

When a command gets created with `runtime.set` if any of the option keys matches that `prop` it'll be computed with the `parser`. That is:

```js
runtime.parse('myProp',function myPropParser(node, opts, stems){
  node.myProp = stems.join(' ').toUpperCase();
});
runtime.set('a command', { myProp : ['will be', 'string', 'and uppercase'] });
runtime.get('a command');
// =>
// { _name : 'command', _parent : 'a', myProp: 'WILL BE UPPERCASE' }
```

In fact this is how `handle`, `completion` and `aliases` are implemented

```js
/*
 * `aliases` parser
 */
runtime.parse('aliases', function (node, opts, stems){
  opts.aliases = util.boil(opts.aliases);
  if(!opts.aliases.length){  return ;  }

  node.aliases = node.aliases || { };
  node.completion = node.completion || [ ];
  opts.aliases.forEach(function(alias){
    node.aliases[alias] = stems.join(' ');
    if(node.completion.indexOf(alias) < 0){
      node.completion.push(alias);
    }
  });
});

/*
 * `completion` parser
 */
runtime.parse('completion', function (node, opts){
  opts.completion = util.boil(opts.completion);
  if(!opts.completion.length){  return ;  }

  opts.completion.forEach(function(name){
    node.completion = node.completion || [ ];
    if(node.completion.indexOf(name) < 0){
      node.completion.push(name);
    }
  });
});

/*
 * `handle` parser
 */
rutnime.parse('handle', function (node, opts, stems){
  if(!opts.handle){  return ;  }

  var stem = null;
  if( stems[0] ){
    stem = stems.slice(-1)[0];
    node.children[stem].handle = opts.handle;
    return ;
  }
  node.handle = opts.handle;
});
```
