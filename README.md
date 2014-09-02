#

[<img alt="npm downloads" src="http://img.shields.io/npm/dm/runtime.svg?style=flat-square" align="right"/>](http://img.shields.io/npm/dm/runtime.svg)
[<img alt="NPM version" src="http://img.shields.io/npm/v/runtime.svg?style=flat-square" align="right"/>](http://www.npmjs.org/package/runtime)
[<img alt="build" src="http://img.shields.io/travis/stringparser/runtime/master.svg?style=flat-square" align="right"/>](https://travis-ci.org/stringparser/runtime/builds)

## Its runtime
> I was trying to use `gulp` at runtime and end up here. [<img alt="progressed.io" src="http://progressed.io/bar/40" align="right"/>](https://github.com/fehmicansaglam/progressed.io)

```
npm install runtime --save
```

<b>Implementation status: young, using Bigfoot diapers</b>

This project is the parent of [gulp-runtime](https://github.com/stringparser/gulp-runtime).

Its aim is to provide a `runtime cli` for your node application where you can use custom commands. But locally or globally. That is: no `npm -g` for your cli *if you want*.

On the repo above I'm doing that for `gulp` so go check it out.

There is no common ground here, because what it does is associate a `command(s)` to a `function` so you can do pretty much whatever you want with it.

## Use case: with [gulp](https://github.com/gulpjs/gulp)

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

Missing some better docs, I know. For now you can look at the [original project documentaion](https://github.com/stringparser/gulp-runtime/docs).

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
