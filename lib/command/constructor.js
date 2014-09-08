/*
 * Module dependencies
 */

var lebug = require('debug')('cmd');
var assert = require('better-assert');
var util = require('../utils');

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

  options = util.isObject(options) ? options : { };

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

    // consuming arguments
    opts = opts || stems;
    opts = util.isObject(opts) ? opts : { };
    stems = util.boil(stems);

    var copy, index = 0, found;

    debug('[get]');
    debug(' stems = ', stems);
    debug(' opts = ', opts);

    //--
    found = config.chain ? anchor : rootNode;
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

    if( opts.clone )
      return new Command({  parse : config.parse,  rootNode : copy });

    if(opts.fork)
      return new Command({  parse : config.parse,  rootNode : anchor });

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

    if(!options){ }
    else if(util.isFunction(options))
      opts = { handle : options };
    else if(util.isObject(options))
      merge(opts, options);

    if(!stems){ }
    else if(util.isFunction(stems))
      merge(opts, { handle : stems });
    else if(util.isObject(stems))
      merge(opts, stems);
    else if(util.isArray(stems)){

      opts.aliases = [ ];
      stems = util.boil(stems).filter(function(stem){
        if(stem[0] !== '-')
          opts.aliases.push(stem);

        return opts.aliases.indexOf(stem) < 0;
      });

      if(opts.aliases[0]) {
        stems = stems.concat(opts.aliases[0]);
        opts.aliases = opts.aliases.slice(1);
      }

      if(!opts.aliases[0])
        delete opts.aliases;

    }

    if( !util.isArray(stems) ) {
      stems = util.boil(stems);
    }


    debug(' stems = ', stems);
    debug('  opts = ', opts);

    node = config.nest ? anchor : rootNode;
    stems.filter(function(stem, index){

      var flag = stem[0] === '-';
      node.children = node.children || { };

      debug('stem = ', stem);
      debug(' flag? '+flag);
      debug(' at node = \n', node);

      if( !node.children[stem] ){
        node.children[stem] = {
            _name : stem,
           _depth : node._depth+1,
          _parent : node._name
        };
      }

      node.completion = node.completion || [ ];
      if( node.completion.indexOf(stem) < 0 )
        node.completion.push(stem);
      else
        opts.completion = (opts.completion || [ ]).concat(stem);

      node = node.children[stem];
    });

    // if any, process the properties
    var anchorRef = anchor;
    this.get(stems.slice(0,-1));

    Object.keys(opts).forEach(function(prop){

      if( reservedProperties.indexOf(prop) < 0 ){
        anchor[prop] = opts[prop];
      } else if( config.parse[prop] ){
        debug('parsed '+prop);
        config.parse[prop].call(this, anchor, opts, stems);
        debug('anchor = \n', anchor);
      }
    }, this);

    anchor = anchorRef;

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

    var copy;

    if( obj === void 0 ){
      copy = merge({ }, config);
      return copy;
    }

    if( util.isString(obj) ){
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

    if( util.isFunction(parser) ){

      config.parse[prop] = parser;
      if(reservedProperties.indexOf(prop) < 0)
        reservedProperties.push(prop);

    } else {
      assert( util.isFunction(arguments[1]) );
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
    } else {
      node.handle = opts.handle;
    }
  });

  return this;
}
