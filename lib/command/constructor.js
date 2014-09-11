/*
 * Module dependencies
 */

var lebug = require('debug')('cmd');
var assert = require('better-assert');
var is = require('utils-type');
var Herror = require('herro').Herror;

var util = require('../utils')
var merge = util.merge;
var debug = util.debug(lebug);
/*
 * Command constructor
 *
 * @params `object` options
 * @returns `object` command instance
 *
 * @api: private
 */

exports = module.exports = Command;

function Command(options){

  if( !(this instanceof Command) ){
    return new Command(options);
  }

  options = is(options).object ? options : { };

  /*
   * Closure variables
   */

  var config = options;
  var rootNode = config.rootNode || {
      _name : options.name || '#rootNode',
     _depth : 0
  };

  var anchor = rootNode;
  var reservedProperties = [
    '_name', '_depth', '_parent', 'children',
    'chain', 'fork', 'clone'
  ];

  config.parse = config.parse || { };

  /*
   * command.get(stems [,options])
   *
   * @param `string`/`array` stems
   * @param `object` options
   *
   * @return this
   */
   this.get = function(stems, opts){

    opts = opts || stems;
    opts = is(opts).object ? opts : { };
    stems = util.boil(stems);

    var copy, index = 0, found;
    //--
    found = config.chain ? anchor : rootNode;

    if(stems[0]){
      debug('[get]');
      debug(' stems = ', stems);
      debug(' opts = ', opts);
    }

    while(stems[index]){

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

    if( config.chain )
      return this;

    copy = merge({ }, anchor);
    if( opts.clone || opts.fork )
      return new Command({  parse : config.parse,  rootNode : opts.clone ? copy : anchor });

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

   this.set = function (stems, options){

    var node, opts = { };

    debug('[set] ');
    debug(' args ', arguments);

    var optsIs = is(options);
    if( optsIs.types )
      debug('optsIs', optsIs);

    if( optsIs.function )
      opts = { handle : options };
    else if( !optsIs.types && optsIs.object )
      merge(opts, options);

    var stemsIs = is(stems);
    if( stemsIs.types)
      debug('stemsIs', stemsIs);

    if( stemsIs.undefined )
      throw new Herror('set(stems [,options]) '+
        'should have at least one argument being: \n'+
        ' - a `string`\n'+
        ' - an `array` of `string`s\n'+
        ' - a `function`'
      );
    else if( stemsIs.function )
      merge( opts, { handle : stems });
    else if( !stemsIs.types && stemsIs.object )
      merge( opts, stems );
    else if( stemsIs.array ){
      opts.aliases = stems.slice(1);
      stems = util.boil(stems[0]);

      if(!opts.aliases[0])
        delete opts.aliases;
    }

    if(!stemsIs.array)
      stems = util.boil(stems);

    node = config.chain ? anchor : rootNode;
    stems.forEach(function(stem, index){

      node.children = node.children || { };

      if( !node.children[stem] ){

        node.children[stem] = {
            _name : stem,
           _depth : node._depth+1,
          _parent : index > 1 ? [node._parent, node._name].join(' ') : node._name
        };
      }

      node.completion = node.completion || [ ];
      if( node.completion.indexOf(stem) < 0 )
        node.completion.push(stem);

      node = node.children[stem];
    });

    // if any, process the properties
    var ref = anchor;
    this.get(node._parent);

    Object.keys(opts).forEach(function(prop){

      if( reservedProperties.indexOf(prop) < 0 ){
        anchor[prop] = opts[prop];
      } else if( config.parse[prop] ){
        debug('[parsing `'+prop+'` with]');
        debug(' stems ', stems);
        debug(' opts ', opts);
        config.parse[prop].call(this, anchor, opts, stems);
        debug('[done parsing]');
        debug('props node', node);
        debug('props anchor ', anchor);
      }
    }, this);

    debug('------------');
    anchor = ref;

    return this;
  };

  /*
   * command.config(obj [, value])
   *
   * @param `object` object
   * @param `object` value
   *
   * @return this
   */
  this.config = function (obj, value){

    var copy, objIs = is(obj);

    if( is.undefined ){
      copy = merge({ }, config);
      return copy;
    } else if( objIs.string ){
      return value ? config[obj] = value : config[obj];
    } else
      merge(config, obj);

    return this;
  };

  /*
   * command.parse(prop [,parser])
   *
   * register a property parser
   *
   * @param `string` prop
   * @param `function` parser
   *
   * parsers are given the corresponding node and the options
   */

  this.parse = function(prop, parser){

    if(!parser){
      var copy = config.parse[prop];
      return copy;
    }

    if( is(parser).function )
      config.parse[prop] = parser;
    else
      assert( is(arguments[1]).function );

    if(reservedProperties.indexOf(prop) < 0){
      reservedProperties.push(prop);
    }

    return this;
  };

  /*
   * `aliases` parser
   */
  this.parse('aliases', function(node, opts, stems){

    opts.aliases = util.boil(opts.aliases);

    if(!opts.aliases[0]) return ;

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
   * completion parser
   */
  this.parse('completion', function(node, opts, stems){

    opts.completion = util.boil(opts.completion);

    if(!opts.completion[0]) return ;

    var nodeRef = node;
    var stem = stems.slice(-1)[0];

    opts.completion.forEach(function(name, index){

      if( name[0] === '-' && stem )
        node = node.children[stem];
      else
        node = nodeRef;

      node.completion = node.completion || [ ];
      if(node.completion.indexOf(name) < 0){
        node.completion.push(name);
      }
    });
  });

  /*
   * handle parser
   */
  this.parse('handle', function(node, opts, stems){

    if(!opts.handle) return ;

    if( stems[0] ){

      var stem = stems.slice(-1)[0];
      node.children[stem].handle = opts.handle;
    } else
      node.handle = opts.handle;

  });

  return this;
}
