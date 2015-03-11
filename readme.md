## its runtime!

[<img alt="NPM version" src="http://img.shields.io/npm/v/runtime.svg?style=flat-square" />](http://www.npmjs.org/package/runtime)
[<img alt="build" src="http://img.shields.io/travis/stringparser/runtime/1.0.svg?style=flat-square"/>](https://travis-ci.org/stringparser/runtime/builds)

> **implementation state**: has grown a beard, has discovered punk...

#### [install](#install) - [documentation](#documentation) - [examples](#examples) - [todo](#todo)

The aim of the project is to provide an easy an non opinionated container to develop `Runtime Interfaces` that being a `Router`, `CLI`, `REPL` or something completely different.

````js
var mongodb = require('mongojs');
var app = require('runtime').create('myAppName');

app.set('get /this/:route', function(next, user){

});


````

## License

[<img alt="LICENSE" src="http://img.shields.io/npm/l/gulp-runtime.svg?style=flat-square"/>](http://opensource.org/licenses/MIT)
