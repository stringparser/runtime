/*
 * Module dependencies
 */

var util = require('../utils');

var merge = util.merge;

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
  options.locked = util.boil(options.locked);

  /*
   * Closure variables
   */

  var config = options;
  var rootNode = config.rootNode || {
      _name : options.name || '#rootNode',
     _depth : 0
  };
  var anchor = rootNode;
  var locked = [
    '_name', '_depth', '_parent',
    'child', 'handle', 'chain', 'fork', 'clone'
  ];

  config.locked.forEach(function(prop){
    if(locked.indexOf(prop) < 0)
       locked.push(prop);
  });

  config.parse = config.parse || { };

  /*
   * command.config(obj [, value])
   *
   */
  this.config = function (obj, value){

    var copy;

    if( obj === void 0 ){
      copy = merge({ }, config);
      return copy;
    }

    if( config[obj] ){
      return value ? config[obj] = value : config[obj];
    } else
      merge(config, obj);

    return this;
  };

  /*
   * command.get(stems [,options])
   *
   * @param `string`/`array` stems
   * @param `object` options
   *
   * @return this
   */
   this.get = function(/*stems, opts*/){

    var copy, args = arguments, stems, opts;

    opts = util.isObject(args[args.length-1]) ? [].pop.call(args) : { };
    stems = util.boil(args[0], /[ ]+/);

    var found= opts.chain ? anchor : rootNode;
    if( arguments.length === 0 ){
      copy = merge({ },  found);
      return copy;
    }

    stems.filter(function(stem){

      if(found.alias && found.alias[stem])
        found = found.child[found.alias[stem]];
      else if(found.child && found.child[stem])
        found = found.child[stem];
      else
        return false;

      return true;
    });

    anchor = found;

    if( opts.fork ){

      return new Command({
           parse : config.parse,
          locked : config.locked,
        rootNode : anchor
      });

    } else if( opts.clone ){

      copy = merge({ }, anchor);
      return new Command({
           parse : config.parse,
          locked : config.locked,
        rootNode : copy
      });

    } else if( opts.chain ){
      return this;
    } else {
      copy = merge({ }, anchor);
      return copy;
    }
  };

  /*
   * command.set(stems [,options, handle])
   *
   * @param `string`/`array` stems
   * @param `object`/`function` addon
   * @param `function` handle
   *
   * NOTE: chained sets are achieved using the addon as an `object` and setting `addon.nest` to `true`.
   */

   this.set = function (stems, options, handle){

    var node, len, args = arguments;
    var opts = util.isObject(options) ? options : { };

    opts.handle = util.isFunction(handle) ? handle : opts.handle;
    opts.alias = util.boil(opts.alias, /[ ]+/);
    opts.completion = util.boil(opts.completion, /[ ]+/);

    node = opts.chain ? anchor : rootNode;

    stems = util.boil(stems, /[ ]+/);
    stems.forEach(function(stem, index){

      var flag = stem[0] === '-';
      // flags always go in the rootNode! ... hmm always?
      // maybe is interesting to have command flags
      // we'll see for now y'all go in the rootNode
      node = flag ? rootNode : anchor;

      node.child = node.child || { };
      node.child[stem] = node.child[stem] || { };
      node.completion = node.completion || [ ];

      if( stem !== '' && node.completion.indexOf(stem) < 0 ){
        merge(node.child[stem], {
            _name : stem,
           _depth : node._depth+1,
          _parent : node._name
        });
        node.completion.push(stem);
      }

      if( !flag )
        anchor = node.child[stem];
    });

    // play it again sam
    node = stems.slice(-1)[0] === '-' ? rootNode : anchor;

    // only last node gets the handle
    if(handle){
      len = stems.length;
      node.child[stems[len-1]].handle = handle;
    }

    // if any, process the properties
    Object.keys(opts).forEach(function(prop){
      if( locked.indexOf(prop) < 0 ){
        anchor[prop] = anchor[prop] || { };
        merge(anchor[prop], opts[prop]);
      } else {
        config.parse[prop](node, opts);
      }
    });

    if( opts.chain ){
      return this;
    } else {
      copy = merge({}, anchor);
      anchor = rootNode;
      // ^ restores anchor
      return copy;
    }

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

    var copy;
    if(!parser){
      copy = config.parser[prop];
      return copy;
    }

    if( !util.isString(prop) ){

      throw new Error('`prop` should be a string');

    } else if( util.isFunction(parser) ){

      if(locked.indexOf(prop) < 0)
        locked.push(prop);

      config.parse[prop] = parser;

    } else
      throw new Error('the second argument, `parser`, should be a function');

    return this;
  };

  /*
   * setup the alias parser
   */
  this.parse('alias', function(node, opts){

    node.alias = node.alias || { };
    opts.aliases.forEach(function(alias){

      node.alias[alias] = stem[0];
      if(node.completion.indexOf(alias) < 0){
        node.completion.push(alias);
      }
    });
  });

  /*
   * setup the completion parser
   */
  this.parse('completion', function(node, opts){

    node.completion = node.completion || [ ];
    opts.completion.forEach(function(name){

      if(node.completion.indexOf(name) < 0){
        node.completion.push(name);
      }
    });
  });

  return this;
}
