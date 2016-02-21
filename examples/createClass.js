'use strict';

var Runtime = require('../.');

var Tor = Runtime.createClass({
  create: function Tor(props){
    Tor.super_.call(this, props);
    this.tor = true;
  }
});

var Tur = Tor.createClass({
  create: function Gulp(props){
    Gulp.super_.call(this, props);
    this.tur = true;
  }
});

var tur = Tur.create({one: 1, two: 2});

console.log(tur);
console.log('tur instanceof Tur', tur instanceof Tur);
console.log('tur instanceof Tor', tur instanceof Tor);
console.log('tur instanceof Runtime', tur instanceof Runtime);
