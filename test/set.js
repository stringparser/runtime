'use strict';

var should = require('should');

module.exports = function(pack, util){

  should.exists(util);

  var testName = 'testSet';
  var runtime = pack.set(testName);

  function rootHandle(){}

  runtime
    .set(rootHandle);

  runtime
    .set({ rootCustomProp : 'rootCustomProp' });

  runtime
    .set({ completion : ['completion', 'built', 'in', 'parser'] });

  runtime
    .set('1', function one(){})
    .set('2', function two(){})
    .set('3', function three(){});

  runtime
    .set('1-nest', function oneNest(){})
    .set('1-nest 2-nest')
    .set('1-nest 2-nest 3-nest', function threeNest(){});

  runtime
    .set(['1-alias', '2-alias', '3-alias'], function aliases(){});

  var rootNode = runtime.get();

  describe('rootNode', function(){

    it('should be Object', function(){
      should(rootNode.constructor.name).be.eql('Object');
    });

    it('should have [_depth, _name, children, completion, aliases]', function(){
      rootNode.should.have
        .properties(['_name', 'children', 'completion', 'aliases']);
    });

    it('should have _name given', function(){
      rootNode.should.have
        .property('_name', testName);
    });

    it('should have depth 0', function(){
      rootNode.should
        .have.property('_depth')
        .and
        .be.exactly(0);
    });

    it('should have the registered handle', function(){
      rootNode.handle.should
        .be.a.Function
        .and.be.eql(rootHandle);
    });

    it('should have the registered custom prop', function(){
      rootNode.rootCustomProp.should
        .be.a.String
        .and.be.eql('rootCustomProp');
    });

    it('should have the registered completion', function(){
      rootNode.completion.should
        .be.an.Array
        .and.containDeep(['completion', 'built', 'in', 'parser']);
    });

    it('should only have one alias registered', function(){
      rootNode.children.should
        .have.property('1-alias')
        .and.not
        .have.properties(['2-alias', '3-alias']);
    });

    it('1-alias should be on children, the rest on aliases', function(){

      rootNode.children.should
        .have.property('1-alias')
        .and.not
        .have.properties(['2-alias', '3-alias']);

      rootNode.aliases.should
        .have.properties(['2-alias', '3-alias'])
        .and.not
        .have.property('1-alias');
    });

    it('should have alias pointing to first element', function(){

      rootNode.aliases.should
        .have.property('2-alias')
        .and.be.exactly('1-alias');

      rootNode.aliases.should
        .have.property('3-alias')
        .and.be.exactly('1-alias');

    });

    it('should have set children', function(){
      rootNode.children.should
        .have.properties(['1','2','3', '1-nest', '1-alias'])
        .and.not
        .have.properties(['2-nest','3-nest', '2-alias', '3-alias']);

      should(rootNode
        .children['1-nest']
        .children['2-nest']
        .children['3-nest']
        .constructor.name).be.eql('Object');
    });

  });

  it('if parent doesn\'t exist they are created', function(){

    runtime
      .set('parents are created');

    should(rootNode
      .children.parents
      .children.are
      .children.created
      .constructor.name).be.eql('Object');
  });

  it('children handle only on last', function(){

    function parentCreated(){}

    runtime
      .set('parents are created', parentCreated);

    should(rootNode
      .children.parents.handle).be.eql(undefined);

    should(rootNode
      .children.parents
      .children.are.handle).be.eql(undefined);

    should(rootNode
      .children.parents
      .children.are
      .children.created.handle).be.eql(parentCreated);
  });

  it('should have handles on where they were defined', function(){

    should(rootNode.children['1'].handle
      .constructor.name).be.eql('Function');

    should(rootNode.children['2'].handle
      .constructor.name).be.eql('Function');

    should(rootNode.children['3'].handle
      .constructor.name).be.eql('Function');

    should(rootNode.children['1-nest'].handle
      .constructor.name).be.eql('Function');

    should(rootNode
      .children['1-nest']
      .children['2-nest'].handle)
    .be.eql(undefined);

    should(rootNode
      .children['1-nest']
      .children['2-nest']
      .children['3-nest'].handle
      .constructor.name)
    .be.eql('Function');
  });

  it('should be the handles that where given', function(){

    should(rootNode.children['1'].handle.name)
      .be.eql('one');

    should(rootNode.children['2'].handle.name)
      .be.eql('two');

    should(rootNode.children['3'].handle.name)
      .be.eql('three');

    should(rootNode.children['1-nest'].handle.name)
      .be.eql('oneNest');

    should(rootNode
      .children['1-nest']
      .children['2-nest']
      .children['3-nest'].handle.name)
    .be.eql('threeNest');
  });

  it('completion should match children and aliases', function(){

    rootNode.completion
      .should.containDeep(
        Object.keys(rootNode.children)
        .concat(Object.keys(rootNode.aliases))
      );
  });
};
