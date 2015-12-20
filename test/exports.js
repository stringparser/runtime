'use strict';

var Runtime = require('../');

it('create() should return a new instance', function(){
  var runtime = Runtime.create();
  runtime.constructor.should.be.eql(Runtime);
});

it('createClass() should return a new constructor', function(){
  var Tor = Runtime.createClass();
  Tor.super_.should.be.eql(Runtime);
  (new Tor()).constructor.should.be.eql(Tor);
});

it('create(object props) should add instance properties', function(){
  var props = {name: 'name'};
  (Runtime.create(props)).should.have.properties(props);
});

it('createClass(object mixin) mixin with new constructor', function(){
  var mixin = {method: function(){}};
  var Ctor = Runtime.createClass(mixin);
  Ctor.prototype.should.have.property('method', mixin.method);
});
