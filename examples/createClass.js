'use strict';

var Runtime = require('../.');

var Tor = Runtime.createClass({
  constructor: function(){
    this.constructor.super_.apply(this, arguments);
    this.isTor = true;
  }
});

console.log(
  Tor.create({something: 'else'})
);
