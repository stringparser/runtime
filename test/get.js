'use strict';

var should = require('should');

module.exports = function(pack, util){

  should.exists(util);
  var runtime = pack.create('testGet');

    function one(){}
    function two(){}
    function three(){}

    function oneNest(){}
    function threeNest(){}

    function aliases(){}
    function parentsCreated(){}

    runtime
      .set('parents are created', parentsCreated);

    runtime
    .set('1', one)
    .set('2', two)
    .set('3', three);

  runtime
    .set('1-nest', oneNest)
    .set('1-nest 2-nest')
    .set('1-nest 2-nest 3-nest', threeNest);

  runtime
    .set(['1-alias', '2-alias', '3-alias'], aliases);

  it('should be able to get nested elements', function(){

    should(runtime.get('1-nest 2-nest 3-nest'))
      .be.an.Object
      .and.have.property('_name')
      .and.be.exactly('3-nest');

    should(runtime.get('1-nest 2-nest'))
      .be.an.Object
      .and.have.property('_name')
      .and.be.exactly('2-nest');
  });

  it('should provide the correct ones', function(){

    runtime.get('1-nest 2-nest 3-nest').handle
      .should.be.a.Function
      .and.be.exactly(threeNest);

    runtime.get('parents are created').handle
      .should.be.a.Function
      .and.be.exactly(parentsCreated);
  });
};
