
[<img alt="npm downloads" src="http://img.shields.io/npm/dm/runtime.svg?style=flat-square" align="right"/>](http://img.shields.io/npm/dm/runtime.svg)
[<img alt="NPM version" src="http://img.shields.io/npm/v/runtime.svg?style=flat-square" align="right"/>](http://www.npmjs.org/package/runtime)
[<img alt="build" src="http://img.shields.io/travis/stringparser/runtime/master.svg?style=flat-square" align="right"/>](https://travis-ci.org/stringparser/runtime/builds)

## its runtime!
> The project is parent of [gulp-runtime](https://github.com/stringparser/gulp-runtime). [<img alt="progressed.io" src="http://progressed.io/bar/40" align="right"/>](https://github.com/fehmicansaglam/progressed.io)

<br>
**implementation state: young, using <i>Bigfoot</i> diapers**

The aim of the project is to provide an easy and unopinionated container to develop `runtime interfaces`. That being a `CLI` or something completely different (`http.Server`, `readline.Interface`, `etc`). There should be an entry event for that "runtime" and the idea is just to hook pre-defined `commands` to that "runtime".

This way, one would define a custom `command`, which associates that to a `function` via the `runtime interface`. The `interface` should provide a flexible way to `set` and `get` commands and give a hook to parse `command` properties thus maintain the housekeeping for that case.

Only one usecase will be built-in by default, a runtime CLI. For this case, command line `completion` of file paths,  *custom commands* and support for *command aliasing* should be given.

After that, you can do pretty much whatever you want with it.

On the [gulp-runtime repo](https://github.com/stringparser/gulp-runtime) I'm working on that `cli` feature for `gulp` so go check it out.

## install

```
npm install runtime
```

## use case: with [gulp](https://github.com/gulpjs/gulp)

```js
 // Your favourite gulpfile.js
 var runtime = new require('runtime').create('gulp');
```

At runtime, when you want to see the prompt, press `enter`.

```bash
[13:07:50] Starting 'default'...
[13:07:50]  > default
[13:07:50] Finished 'default' after 800 μs
 > gulp
```

The prompt by it self does nothing, but if you wrote a custom command

```js
runtime.set('yeeeha', function(){

  console.log('Start dancing!')
});
```

Life changed
```shell
> gulp yeeeha
Start dancing!
> gulp
```

Missing some better docs, I know. For now you can look at the [original project documentaion](hhttps://github.com/stringparser/gulp-runtime/tree/master/docs).

## TODO
- [ ] Write tests.
- [ ] API documentation.
- [X] Support standard shell behavior (Ctrl+L, Ctrl+C, history, etc.).
  * [`readline`](http://nodejs.org/api/readline.html) to the rescue. It even provides completion options!
- [X] Command completion.
- [X] Register custom runtime commands.

<hr>

[![NPM](https://nodei.co/npm/runtime.png?downloads=true)](https://nodei.co/npm/runtime/)

## License

[<img alt="LICENSE" src="http://img.shields.io/npm/l/gulp-runtime.svg?style=flat-square"/>](http://opensource.org/licenses/MIT)
