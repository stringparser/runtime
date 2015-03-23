'use strict';

var app = require('../../.').create();

function a(next){
  setTimeout(next, Math.random()*10);
}

function b(next){
  setTimeout(next, Math.random()*2);
}

function c(next){
  setTimeout(next, Math.random()*10);
}

app.set(':handle(\\d+)', function(next){
  setTimeout(next, Math.random()*10);
});

var pile = [];
pile.push(app.stack('1 2 3'));
pile.push(app.stack(a, b, c));
pile.push(app.stack('1 2 3', {wait: true}));
pile.push(app.stack(a, b, c, {wait: true}));
pile.push(app.stack(pile[2], pile[3], {wait: true}));

app.set({
  onHandleEnd: function(){
    if(this.queue || this.host){ return; }
    var mode = this.wait ? 'series' : 'parallel';
    console.log('\ndone with %s in %s\n', this.path, mode);
    if(pile.length){
      var stack = pile.shift();
      setTimeout(stack, 1000);
    }
  }
});

pile.shift()();
