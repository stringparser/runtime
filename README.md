## Its runtime[<img alt="progressed.io" src="http://progressed.io/bar/29" align="right"/>](https://github.com/fehmicansaglam/progressed.io)

<b>Implementation status: young</b>

This project is a spin-off of [gulp-runtime](https://github.com/stringparser/gulp-runtime).

Its aim is to provide a runtime cli for your node application where you can use custom commands. But locally instead of globally. That is: no `npm -g` for your cli.

There is no common ground here, because what it does is associate a `command(s)` to a `function` so you can do pretty much whatever you want with it.

I was trying to use `gulp` at runtime and end up here.

## Use case: with gulp

```js
 // Your favourite gulpfile.js
 var runtime = new require('runtime').createInterface('gulp');
```

At runtime, when you want to see the prompt, press `enter`.

```bash
[13:07:50] Starting 'default'...
[13:07:50]  > default
[13:07:50] Finished 'default' after 800 μs
 > gulp
```

De prompt by it self does nothing, but if you wrote a custom command

```js
runtime.set('yeeeha', function(){

  console.log('Start dancing!')
  gulp.start('default', function(){
    runtime.prompt();
  });

});
```

Life changed
```shell
> gulp yeeeha
Start dancing!
> gulp
```

> If you are curious about it go to the [gulp-runtime](https://github.com/stringparser/gulp-runtime) repo.

## TODO
- [X] Support standard shell behavior (Ctrl+L, Ctrl+C, history, etc.).
    * [`readline`](http://nodejs.org/api/readline.html) to the rescue. It even provides completion options!
 - [ ] API documentation.
 - [X] Command completion.
 - [X] Register custom runtime commands.
 - [ ] Write tests.

<hr>

[![NPM](https://nodei.co/npm/runtime.png?downloads=true)](https://nodei.co/npm/runtime/)

## License

MIT
