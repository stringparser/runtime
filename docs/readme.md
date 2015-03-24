##### Documentation - [`module.exports`][t-module] - [Runtime API][t-runtime-api] - [Stack API][t-stack-api]

## runtime documentation

### Getting started

Install `runtime` using [npm][x-npm]

    npm install runtime

and then require it into any module

```js
var app = require('runtime').create();

app.set(':handle', function(next){
  setTimeout(next, Math.random()*10);
})

app.stack('1 2 3 4 5 6')();
app.stack('one two three four five six', {wait: true})();
```

### Browser

At the moment is not tested in browsers but it should work. Use it at your own risk though :). Either a browserify or webpack `bundle.js` should do the trick.


<!--
  x-: is for just a link
  t-: is for doc's toc
-->

[x-npm]: https://npmjs.org

[t-docs]: ./readme.md
[t-module]: ./module.md
[t-stack-api]: ./stack-api.md
[t-runtime-api]: ./runtime-api.md
