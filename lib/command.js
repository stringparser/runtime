'use strict';

var util = require('./utils');
var debug = util.debug(__filename);

exports = module.exports = Command;

function Command(options){

  if( !(this instanceof Command) ){
    return new Command(options);
  }

  /*
   * Closure variables
   */

  var config = util.type(options).plainObject || { };
  config.parse = config.parse || { };
  debug('config', config);

  var reservedProperties = ['fork', 'clone'];
  var rootNode = { _depth : 0, children : { } };
  rootNode._name = util.type(config.name).string
  || '#rootNode';
  var anchor = rootNode;

  reservedProperties.concat(Object.keys(rootNode));

  /*
   * Command.get(stems [,options])
   */

  this.get = function (stems, opts){
    opts = opts || { };
    stems = util.boil(stems);
    //--
    debug(' stems ', stems, '\n opts', opts);

    var index = 0, found = rootNode;
    while( stems[index] ){
      var stem = stems[index];
      if(found.aliases && found.aliases[stem]){
        stems = util.boil(stems.join(' ').replace(stem, found.aliases[stem]));
        stem = stems[index];
      }
      if(found.children && found.children[stem]){
        index++;
        found = found.children[stem];
      } else {
        index = -1;
      }
    }
    anchor = found;
    //--
    var copy = util.merge({ }, anchor);
    if( opts.clone || opts.fork ){
      return Command({
           parse : config.parse,
        rootNode : opts.copy ? copy : anchor
      });
    }
    return copy;
  };

  /*
   * Command.set(stems [,options])
   */

   this.set = function (stems, opts){

    var stemsIs = util.type(stems);
    if( !stemsIs.match(/function|string|array|object/g) ){
      throw new util.Error('set(stems [,options]) \n'+
        'should have at least one argument being: \n'+
        ' - a `string`\n'+
        ' - an `array` of `strings`\n'+
        ' - a `function`\n'+
        ' - an `object`'
      );
    }

    var optsIs = util.type(opts);
    opts = optsIs.plainObject || stemsIs.plainObject || { };
    opts.handle = optsIs.function || stemsIs.function;

    if( stemsIs.array ){
      opts.aliases = stems.slice(1);
      stems = stems[0];
    }
    stems = util.boil(stems);

    debug(' stems ', stems, '\n opts', opts);

    var node = rootNode;
    stems.forEach(function parseChildren(stem, index){
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
    });

    // if any, process the properties
    this.get(node._parent);
    Object.keys(opts).forEach(function parseProps(prop){
      if( config.parse[prop] ){
        config.parse[prop].call(this, anchor, opts, stems);
      } else {
        node[prop] = opts[prop];
      }
    }, this);
    return this;
  };

  /*
   * Command.config(obj [, value])
   *
   * @param `object` object
   * @param `object` value
   *
   * @return this
   */

  this.config = function (obj, value){
    var target, valueIs;
    if( obj === void 0 ){
      target = util.merge({ }, config);
      return target;
    }

    if( arguments.length > 1 ){
      valueIs = util.type(value);
      if( valueIs.plainObject ){
        config[obj] = config[obj] || { };
        value = util.merge(config[obj], value);
      } else {
        value = config[obj] = valueIs.array ? value.slice() : value;
      }
      return value;
    }
    if ( util.type(obj).plainObject ){
      Object.keys(obj).forEach(function(key){
        config[key] = config[key] || { };
        target = util.merge({ }, obj[key]);
        config[key] = target;
      });
      return obj;
    }
    return config[obj];
  };

  /*
   * this.parse(prop [,parser])
   *
   * register a property parser
   *
   * @param `string` prop
   * @param `function` parser
   *
   * parsers are given the current node and the options
   */

  this.parse = function parse(prop, parser){
    if( !parser ){
      var copy = config.parse[prop];
      return copy;
    }
    if( typeof parser === 'function' ){
      if( config.parse[prop] === void 0 ){
        reservedProperties.push(prop);
      }
      config.parse[prop] = parser;
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
  this.parse('aliases', function (node, opts, stems){
    opts.aliases = util.boil(opts.aliases);
    if(!opts.aliases.length){  return ;  }

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
  this.parse('completion', function (node, opts){
    opts.completion = util.boil(opts.completion);
    if(!opts.completion.length){  return ;  }

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
  this.parse('handle', function (node, opts, stems){
    if(!opts.handle){  return ;  }

    var stem = null;
    if( stems[0] ){
      stem = stems.slice(-1)[0];
      node.children[stem].handle = opts.handle;
      return ;
    }
    node.handle = opts.handle;
  });
}
