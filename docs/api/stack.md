##### [Documentation][t-docs] - [`module.exports`][t-module] - [Runtime API][t-runtime-api] - Stack API

## Stack API

Code is worth a thousand words

```js
var app = require('runtime').create();

function foo(next){ next(); /* or return stream, promise or observable */ }
function bar(next){ next(); /* or return stream, promise or observable */ }
function baz(next){ next(); /* or return stream, promise or observable */ }

var tack = app.stack(foo, bar, baz);
tack(); // runs foo, bar baz in parallel

var teck = app.stack(foo, bar, baz, {wait: true});
teck(); // runs foo, bar, baz in series

var tick = app.stack(foo, app.stack(bar, baz), {wait: true});
tick(); // runs foo in series with bar, baz which is run in parallel

var tock = app.stack(foo, app.stack(bar, baz), {wait: true});
tock(); // runs foo in series with bar, baz wich is run in parallel

var tuck = app.stack(foo, app.stack(bar, baz, {wait: true}), {wait: true});
tuck(); // runs foo in series with bar, baz wich is run in series
```

[`app.stack(...arguments[, props])`][t-runtime-api-stack] returns a callback and constructs a consumable stack object which, upon call, will be used to invoke and give context to `...arguments`. As

##### [Documentation][t-docs] - `module.exports` - [Runtime API][t-runtime-api] - [Stack API][t-stack-api]

<!--
  x-: is for just a link
  t-: is for doc's toc
-->

[t-docs]: http://github.com/stringparser/runtime/tree/master/docs

[t-module]: http://github.com/stringparser/runtime/tree/master/docs/api/readme.md

[t-stack-api]: http://github.com/stringparser/runtime/tree/master/docs/api/stack.md

[t-runtime-api]: http://github.com/stringparser/runtime/tree/master/docs/api/runtime.md
[t-runtime-api-stack]: http://github.com/stringparser/runtime/tree/master/docs/api/runtime.md#stack
