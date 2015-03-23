'use strict';

var runtime = require('../../.');

var defaults = {wait: true};
var app = runtime.create('app', defaults);

app.set(':handle', function(next){
  setTimeout(next, Math.random()*100);
});

// the defaults will make these run in series
var one = app.stack('1 2 3');
var two = app.stack('4 5 6');
var three = app.stack('7 8 9');

// we can override the defaults for each stack
// making each of them run in parallel with the others
app.stack(one, app.stack(two, three), {wait: false})();
