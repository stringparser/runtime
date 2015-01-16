'use strict';

var app = require('./.').create('stack');

app.set(':root :start', function two(){});

function once(){ return 'fake'; }
function twice(){}

console.log('\n -- stack -- \n');
console.log(app.stack(once, 'one two three', twice));
