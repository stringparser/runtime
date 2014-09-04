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
    'child', 'chain', 'fork', 'clone'
  ];

  config.locked.forEach(function(prop){
    if(locked.indexOf(prop) < 0)
       locked.push(prop);
  });

  config.parse = config.parse || { };

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
   this.get = function(stems, opts){

    var copy;

    // consuming arguments
    opts = opts || stems;
    opts = util.isObject(opts) ? opts : { };
    stems = util.boil(stems, /[ ]+/);

    var found = opts.chain ? anchor : rootNode;

    // stems.forEach(function(stem){
    //
    //   if(found.alias && found.alias[stem])
    //     found = found.child[found.alias[stem]];
    //   else if(found.child && found.child[stem])
    //     found = found.child[stem];
    //   else
    //     return false;
    //
    //   return true;
    // });

    var index = 0;
    while(stems[index]){

      var stem = stems[index];
      if(found.alias && found.alias[stem]){
        stems.unshift.apply(stems, util.boil(found.alias[stem]));
        stem = stems[index];
      }

      if(found.child && found.child[stem]){
        found = found.child[stem];
        index++;
      } else {
        index = -1;
      }
    }

    anchor = found;

    if( opts.chain || opts.fork || opts.clone ){

      if( opts.chain )
        return this;

      if( opts.clone ){
        copy = merge({ }, anchor);
        return new Command({
             parse : config.parse,
            locked : config.locked,
          rootNode : copy
        });
      }

      if( opts.fork ){
        return new Command({
             parse : config.parse,
            locked : config.locked,
          rootNode : anchor
        });
      }

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

   this.set = function (/*stems [, options, handle]*/){

    var node, len, args = [].slice.call(arguments);
    var stems, opts;

    stems = util.boil(args.shift(), /[ ]+/);
    opts = util.isObject(args[0]) ? args.shift() : { };
    opts.handle = util.isFunction(args[0]) ? args.shift() : opts.handle;

    len = stems.length;
    node = opts.chain ? anchor : rootNode;
    stems.forEach(function(stem, index){

      var flag = stem[0] === '-';
      // flags always go in the rootNode! ... hmm always?
      // maybe is interesting to have command flags
      // we'll see for now y'all go in the rootNode
      node = flag ? rootNode : node;

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

      if( !flag && index < len-1 )
        node = node.child[stem];
    });

    // if any, process the properties
    Object.keys(opts).forEach(function(prop){
      if( locked.indexOf(prop) < 0 ){
        node[prop] = opts[prop];
      } else {
        config.parse[prop].call(this, stems, opts, node, anchor);
      }
    }, this);

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
  this.parse('alias', function(stems, opts, node, anchor){

    anchor.alias = anchor.alias || { };
    opts.alias = util.boil(opts.alias, /[ ]+/);

    console.log('alias');
    console.log('node =', node);
    console.log('opts =', opts);
    console.log('anchor=', anchor);

    opts.alias.forEach(function(alias){

      anchor.alias[alias] = stems.join(' ');
      if(anchor.completion.indexOf(alias) < 0){
        anchor.completion.push(alias);
      }
    });
  });

  /*
   * setup the completion parser
   */
  this.parse('completion', function(stems, opts, node){

    node.completion = node.completion || [ ];
    opts.completion = util.boil(opts.completion, /[ ]+/);

    opts.completion.forEach(function(name){

      if(node.completion.indexOf(name) < 0){
        node.completion.push(name);
      }
    });
  });

  /*
   * setup the completion parser
   */
  this.parse('handle', function(stems, opts, node){

    if( util.isFunction(opts.handle) )
      node.handle = opts.handle;
  });

  return this;
}
