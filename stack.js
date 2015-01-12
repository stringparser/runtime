'use strict';

var app = require('./.').create('stack');

app.set(':handle', function handler(){});

function once(){ return 'fake'; }
function twice(){}

console.log('\n -- stack -- \n');
console.log(app.stack(once, 'one two three four five', twice));
