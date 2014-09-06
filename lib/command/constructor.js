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

  /*
   * Closure variables
   */

  var config = options, rootNode = config.rootNode || {
      _name : options.name || '#rootNode',
     _depth : 0
  };
  var anchor = rootNode;
  var locked = [
    '_name', '_depth', '_parent', 'child',
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

    console.log('get');
    console.log('stems = ', stems);
    console.log(' opts = ', opts);

    //--
    found = opts.chain ? anchor : rootNode;
    while(stems[index]){

      var stem = stems[index];
      if(found.alias && found.alias[stem]){
        stems = stems.join(' ').replace(stem, found.alias[stem]);
        stems = util.boil(stems);
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
    //--

    if( opts.delete ){

      var name = stems.slice(-1)[0];
      var anchorRef = anchor;
      this.get(stems.slice(0,-1));

      opts.delete = util.boil(opts.delete);

      if(!opts.delete[0])
        opts.delete.push(name);

      var parse = config.parse;

      Object.keys(parse).forEach(function(prop, index){
        parse[prop](anchor, opts, stems);
      });

      anchor = anchorRef;

      if(anchor.child){
        delete anchor.child[name];
      }
    }

    if( opts.chain )
      return this;

    if( opts.clone || opts.fork ){

      if(opts.fork)
        return new Command({  parse : config.parse,  rootNode : anchor });

      copy = merge({ }, anchor);
      return new Command({  parse : config.parse,  rootNode : copy });
    }

    copy = merge({ }, anchor);
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

    if(!options){ }
    else if(util.isFunction(options))
      opts = { handle : options };
    else if(util.isObject(options))
      merge(opts, options);
    else if(util.isArray(options))
      opts.alias = options;

    if(!stems){ }
    else if(util.isFunction(stems))
      merge(opts,{ handle : stems });
    else if(util.isObject(stems))
      merge(opts, stems);
    else if(util.isArray(stems)){

      if(stems[1]){
        opts.alias = stems.slice(1);
        stems = util.boil(stems[0]);
      } else {
        stems = util.boil(stems[0]);
      }
    }

    if(!util.isArray(stems)){
      stems = util.boil(stems);
    }

    console.log('set');
    console.log('stems = ', stems);
    console.log(' opts = ', opts);

    node = opts.chain ? anchor : rootNode;

    stems.forEach(function(stem){

      var flag = stem[0] === '-';
      node = flag ? rootNode : node;

      node.child = node.child || { };
      node.completion = node.completion || [ ];

      console.log('\n stem = ', stem)
      console.log(' flag? '+flag+' ; set node = \n', node)

      if( !node.child[stem] ){

        node.child[stem] = {
            _name : stem,
           _depth : node._depth+1,
          _parent : node._name
        };

        if( node.completion.indexOf(stem) < 0)
          node.completion.push(stem);
      }

      if( !flag )
        node = node.child[stem];
    });


    // if any, process the properties
    var anchorRef = anchor;
    this.get(stems.slice(0,-1));

    Object.keys(opts).forEach(function(prop){

      if( locked.indexOf(prop) || config.parse[prop] )
        console.log('\nparsed '+prop);

      if( locked.indexOf(prop) < 0 ){
        anchor[prop] = opts[prop];
      } else if( config.parse[prop] ){
        config.parse[prop].call(this, anchor, opts, stems);
      }

      if( locked.indexOf(prop) || config.parse[prop] )
        console.log([anchor, opts, stems]);

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

    var copy;

    if(!parser){
      copy = config.parse[prop];
      return copy;
    }

    if( !util.isString(prop) ){
      throw new Error('`prop` should be a string');
    }

    parser = util.isFunction(parser) ? parser : null;

    if( parser ){

      if(locked.indexOf(prop) < 0)
        locked.push(prop);

      config.parse[prop] = config.parse[prop] || { };
      config.parse[prop] = parser;

    } else {
      throw new Error('the second argument, `parser`, should be a function');
    }

    return this;
  };

  /*
   * setup the alias parser
   */
  this.parse('alias', function(node, opts, stems){

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
  this.parse('completion', function(node, opts, stems){

    if( !opts.delete ){

      if(!node.completion)
        node.completion = node.completion || [ ];

      opts.completion = util.boil(opts.completion);
      if(opts.completion === null)
        return ;

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
  this.parse('handle', function(node, opts, stems){

    if(opts.delete)
      return ;

    if(stems[0]){
      var stem = stems.slice(-1)[0];
      node.child[stem].handle = opts.handle;
    } else {
      node.handle = opts.handle;
    }
  });

  return this;
}
