'use strict';

var util = require('../utils');
var debug = util.debug(__filename);

function Barn(options){

  /*
   * instance as a configuration wrapper
   */
  function barn(obj, value){
    return barn.config(obj, value);
  }

  /*
   * Closure variables
   */

  var config = util.type(options).plainObject || { };

  var reservedProperties = [
    '_name', '_depth', '_parent', 'children',
    'chain', 'fork', 'clone'
  ];

  var rootNode = config.rootNode || {
      _name : config.name || '#rootNode',
     _depth : 0
  };

  var anchor = rootNode;


  config.parse = config.parse || { };
  debug('config', config);

  /*
   * barn.get(stems [,options])
   *
   * @param `string`/`array` stems
   * @param `object` options
   *
   * @return barn
   */
   barn.get = function get(stems, opts){

    opts = util.type(opts || stems).plainObject || { };
    stems = util.boil(stems);

    //--
    found = config.chain ? anchor : rootNode;

    debug(' stems = ', stems);
    debug(' opts = ', opts);

    var found, index = 0;
    while( stems[index] ){

      var stem = stems[index];
      if(found.aliases && found.aliases[stem]){
        stems = stems.join(' ').replace(stem, found.aliases[stem]);
        stems = util.boil(stems);
        stem = stems[index];
      }

      if(found.children && found.children[stem]){
        found = found.children[stem];
        index++;
      } else {
        index = -1;
      }
    }
    anchor = found;
    //--

    if( config.chain ){
      return this;
    }

    var copy = util.merge({ }, anchor);

    if( opts.clone || opts.fork ){
      copy = opts.clone ? copy : null;
      return Barn({
           parse : config.parse,
        rootNode : copy || anchor
      });
    }
    return copy;
  };

  /*
   * command.set(stems [,options])
   *
   * @param `string`/`array` stems
   * @param `object`/`function` options
   *
   * NOTE: chaining is achieved with
   *   - options.chain = truthy
   */

   barn.set = function set(stems, options){

    debug(' args ', arguments, '\n ------');

    var stemsIs = util.type(stems);

    if(   stemsIs.undefined || !stemsIs.match(/function|string|array/) ){
      throw new util.Error('set(stems [,options]) '+
        'should have at least one argument being: \n'+
        ' - a `string`\n'+
        ' - an `array` of `strings`\n'+
        ' - a `function`'
      );
    }

    var optsIs = util.type(options);
    var opts = optsIs.plainObject || stemsIs.plainObject || { };
    opts.handle = optsIs.function || stemsIs.function;

    if( !opts.handle ){
      delete opts.handle;
    }

    if( stemsIs.array ){
      opts.aliases = stems.slice(1);
      stems = util.boil(stems[0]);

      if(!opts.aliases[0]){
        delete opts.aliases;
      }
    } else {
     stems = util.boil(stems);
    }
    debug('stemsIs', stemsIs, '\n stems ', stems);
    debug('optIs', opts, '\n opts ', opts);

    var node = config.chain ? anchor : rootNode;

    stems.forEach(parseChildren);
    function parseChildren(stem, index){
      node.completion = node.completion || [ ];
      if( node.completion.indexOf(stem) < 0 ){
        node.completion.push(stem);
      }
      node.children = node.children || { };
      node.children[stem] = node.children[stem] || {
          _name : stem,
         _depth : node._depth + 1,
        _parent : index > 1
          ? node._parent + ' ' + node._name
          : node._name
      };
      node = node.children[stem];
    }

    var sink, ref = anchor;
    barn.get(node._parent);

    // if any, process the properties
    var props = Object.keys(opts);

    sink = props[0]
      ? props.forEach(parseProps)
      : null;

    function parseProps(prop){
      if( reservedProperties.indexOf(prop) < 0 ){
        anchor[prop] = opts[prop];
      } else if( config.parse[prop] ){
        debug('[parsing `'+prop+'` with]');
        debug(' stems ', stems);
        debug(' opts ', opts);
        config.parse[prop].call(barn, anchor, opts, stems);
      }
      debug('[done parsing]');
      debug('props node', node);
      debug('props anchor ', anchor);
    }

    anchor = ref;
    // ^ restore the anchor

    return this;
  };

  /*
   * barn.config(obj [, value])
   *
   * @param `object` object
   * @param `object` value
   *
   * @return barn
   */

  barn.config = function configure(obj, value){

    var copy;
    if( obj === void 0 ){
      copy = util.merge({ }, config);
      return copy;
    }

    debug('config', config);

    if( typeof obj === 'string' ){
      return value ? config[obj] = value : config[obj];
    }

    if( util.type(obj).plainObject ){
      Object.keys(obj).forEach(function(key){
        config[key] = util.merge(
          config[key] || { }, obj[key]
        );
      });
    }
    return this;
  };

  /*
   * barn.parse(prop [,parser])
   *
   * register a property parser
   *
   * @param `string` prop
   * @param `function` parser
   *
   * parsers are given the corresponding node and the options
   */

  barn.parse = function parse(prop, parser){

    if( !parser ){
      var copy = config.parse[prop];
      return copy;
    }

    if( typeof parser === 'function' ){

      config.parse[prop] = parser;
      if(reservedProperties.indexOf(prop) < 0){
        reservedProperties.push(prop);
      }
      return this;
    }

    throw new util.Error(
      'parse(prop, parser): \n'+
      ' If given, parser should be a function'
    );
  };

  /*
   * `aliases` parser
   */
  barn.parse('aliases', function (node, opts, stems){

    opts.aliases = util.boil(opts.aliases);

    if(!opts.aliases[0]){
      return ;
    }

    node.aliases = node.aliases || { };
    node.completion = node.completion || [ ];
    opts.aliases.forEach(function(alias){

      node.aliases[alias] = stems.join(' ');
      if(node.completion.indexOf(alias) < 0){
        node.completion.push(alias);
      }
    });
  });

  /*
   * `completion` parser
   */
  barn.parse('completion', function (node, opts){

    opts.completion = util.boil(opts.completion);

    if(!opts.completion[0]){
      return ;
    }

    opts.completion.forEach(function(name){

      node.completion = node.completion || [ ];
      if(node.completion.indexOf(name) < 0){
        node.completion.push(name);
      }
    });
  });

  /*
   * `handle` parser
   */
  barn.parse('handle', function (node, opts, stems){

    if(!opts.handle){
      return ;
    }

    var stem = null;
    if( stems[0] ){
      stem = stems.slice(-1)[0];
      node.children[stem].handle = opts.handle;
      return ;
    }
    node.handle = opts.handle;
  });

  return barn;
}

module.exports = Barn;
