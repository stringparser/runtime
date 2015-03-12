## its runtime!

[<img alt="NPM version" src="http://img.shields.io/npm/v/runtime.svg?style=flat-square" />](http://www.npmjs.org/package/runtime)
[<img alt="build" src="http://img.shields.io/travis/stringparser/runtime/1.0.svg?style=flat-square"/>](https://travis-ci.org/stringparser/runtime/builds)

> **implementation state**: has grown a beard, has discovered punk...

#### [install](#install) - [documentation](#documentation) - [examples](#examples) - [todo](#todo)

The aim of the project is to provide an easy an non opinionated container to develop `Runtime Interfaces` that being a `Router`, `CLI`, `REPL` or something completely different.

````js
var http = require('http');
var mongodb = require('mongojs');
var app = require('runtime').create('myAppName');

app.set('get /user/:profile([a-z]+)', function(next, req, res){

});

var db = mongodb('db', ['users']);
function getUser(next, req, res){
  return db.users.findOne({_id: req.params.profile});
}




````

## License

[<img alt="LICENSE" src="http://img.shields.io/npm/l/gulp-runtime.svg?style=flat-square"/>](http://opensource.org/licenses/MIT)
