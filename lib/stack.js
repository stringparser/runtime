'use strict';

var util = require('./util');

module.exports = exports = Stack;

function Stack(app, args){

  util.merge(this, {length: 0, index: 0});
  this.root = app.get(util.boilArgs(args));
  this.reporter = app.get('#reporter ' + this.root.path);
  this.argv = this.root.argv;
  delete this.root.argv;
  delete this.reporter.argv;

}
