'use strict';

var Runtime = require('../.');

var Tor = Runtime.createClass({
  create: function(){
    this.isTor = true;
  }
});

var Tur = Tor.createClass({
  create: function(){
    this.thing = true;
  }
});

console.log(
  Tur.create()
)
