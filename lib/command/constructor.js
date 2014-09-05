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
    '_name', '_depth', '_parent', 'child',
    'chain', 'fork', 'clone'
  ];

  config.locked.forEach(function(prop){
    if(locked.indexOf(prop) < 0)
       locked.push(prop);
  });

  delete config.locked;

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

    var copy;

    // consuming arguments
    opts = opts || stems;
    opts = util.isObject(opts) ? opts : { };
    stems = util.boil(stems);

    var found = (opts.chain || opts.last) ? anchor : rootNode;

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

    if( opts.last ){
      copy = merge({ }, anchor);

      if( util.isString(opts.last) )
        return copy[opts.last];
      else
        return copy;
    }

    var index = 0;
    while(stems[index]){

      var stem = stems[index];
      if(found.alias && found.alias[stem]){
        stems = util.boil(
          stems.join(' ').replace(stem, found.alias[stem])
        );
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

    if( opts.delete ){

      var name = stems.slice(-1)[0];
      var nodeRef = anchor;
      this.get(stems.slice(0,-1));
      var anchorRef = anchor;

      opts.delete = util.boil(opts.delete);

      if(!opts.delete[0])
        opts.delete.push(name);

      var parse = config.parse;

      Object.keys(parse).forEach(function(prop, index){

        if( !parse[prop].node ){
          anchor = nodeRef;
        } else {
          anchor = anchorRef;
        }

        parse[prop].handle(anchor, opts, stems);

      });

      anchor = anchorRef;

      if(anchor.child){
        delete anchor.child[name];
      }
    }

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

    copy = merge({ }, anchor);
    return copy;
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

   this.set = function (/* arguments */){

    var node, stems, opts = { };
    var args = [].slice.call(arguments);

    opts.handle = util.isFunction(args[args.length-1]) ? args.pop() : void 0;
    opts  = merge(opts,
      util.isObject(args[args.length-1]) ? args.pop() : { }
    );

    if( util.isArray(args[0]) ){
      stems = arsg[0][0];
      opts.alias = args[0].slice(1);
    } else {
      stems = util.boil(stems);
    }

    node = opts.chain ? anchor : rootNode;
    stems.forEach(function(stem){

      var flag = stem[0] === '-';
      // flags always go in the rootNode! ... hmm always?
      // maybe is interesting to have command flags
      // we'll see for now y'all go in the rootNode
      // doesn't work
      //
      // this -> node = flag ? rootNode : node;
      //
      // overrides the parent's node properties

      node.child = node.child || { };
      node.child[stem] = node.child[stem] || { };
      node.completion = node.completion || [ ];

      if( node.completion.indexOf(stem) < 0 ){
        merge(node.child[stem], {
            _name : stem,
           _depth : node._depth+1,
          _parent : node._name
        });
        node.completion.push(stem);
      }

      if( !flag )
        node = node.child[stem];
    });

    // if any, process the properties
    Object.keys(opts).forEach(function(prop){

      if( locked.indexOf(prop) < 0 ){

        node[prop] = opts[prop];

      } else if( config.parse[prop] ){

        var parse = config.parse[prop];
        var anchorRef = anchor;
        var nodeRef = node;

        if(parse.node === 'anchor')
          node = anchor;
        else if( util.isString(parse.node) ){
          this.get(parse.node);
          node = anchor;
        }

        parse.handle.call(this, node, opts, stems);

        if(parse.node){
          node = nodeRef;
          anchor = anchorRef;
        }
      }
    }, this);

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

  this.parse = function(prop, opts, parser){

    var copy;
    if(!opts){
      copy = config.parse[prop];
      return copy;
    }

    if( !util.isString(prop) ){
      throw new Error('`prop` should be a string');
    }

    opts = opts || parser;
    parser = parser || opts;
    opts = util.isObject(opts) ? opts : { };
    parser = util.isFunction(parser) ? parser : opts.parser;

    if( parser ){

      if(locked.indexOf(prop) < 0)
        locked.push(prop);

      config.parse[prop] = config.parse[prop] || { };
      config.parse[prop].handle = parser;

      if(opts.node)
        config.parse[prop].node = opts.node;

    } else {
      throw new Error('the second argument, `parser`, should be a function');
    }

    return this;
  };

  /*
   * setup the alias parser
   */
  this.parse('alias', { node : 'anchor' }, function(node, opts, stems){

    opts.alias = util.boil(opts.alias);

    if( !opts.delete ){

      if(opts.alias[0])
        node.alias = node.alias || { };

      if(!node.completion)
        node.completion = [ ];

      opts.alias.forEach(function(alias){

        node.alias[alias] = stems.join(' ');
        if(node.completion.indexOf(alias) < 0){
          node.completion.push(alias);
        }
      });

    } else {

      if( !node.alias )
        return ;

      if( opts.delete[0] ){

        opts.delete.forEach(function(alias){
          if(anchor.alias[alias])
            delete anchor.alias[alias];
        });

      } else {

        Object.keys(node.alias).forEach(function(alias){

          var match = node.alias[alias].match(stems);
          if( match ){

            node.alias[alias] = match.join('');
            if(node.alias[alias] === '')
              delete node.alias[alias];
          }
        });
      }
    }

  });

  /*
   * setup the completion parser
   */
  this.parse('completion', { node : 'anchor' }, function(node, opts, stems){

    opts.completion = util.boil(opts.completion);

    if( !opts.delete ){

      if(!node.completion)
        node.completion = node.completion || [ ];

      opts.completion.forEach(function(name){
        if(node.completion.indexOf(name) < 0){
          node.completion.push(name);
        }
      });

    } else {

      if( !node.completion )
        return ;

      if( opts.delete[0] ){

        opts.delete.forEach(function(name){

          var index = node.completion.indexOf(name);
          if( index > -1)
            node.completion.splice(index, 1);
        });

        if(!node.completion[0]){
          delete node.completion;
          delete node.child;
        }
      }
    }

  });

  /*
   * setup the completion parser
   */
  this.parse('handle', function(node, opts){

    if( !opts.delete ){

      if( util.isFunction(opts.handle) )
        node.handle = opts.handle;
    }

  });

  return this;
}
