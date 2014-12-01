'use strict';

var util = require('./utils');
var debug = util.debug(__filename);

exports = module.exports = Command;

function Command(options){

  if( !(this instanceof Command) ){
    return new Command(options);
  }

  this.cache = { _depth : 0, children : { } };
  this.cache._name = util.type(options.name).string || '#rootNode';

  /*
   * Command.config(prop [,parser])
   * register a property parser
   */

  var config = { parse : { } };
  this.config = function (key, value){
    var target, valueIs;
    if( key === void 0 ){
      target = util.merge({ }, config);
      return target;
    }

    if( arguments.length > 1 ){
      valueIs = util.type(value);
      if( valueIs.plainObject ){
        config[key] = config[key] || { };
        value = util.merge(config[key], value);
      } else {
        value = config[key] = valueIs.array ? value.slice() : value;
      }
      return value;
    }
    if ( util.type(key).plainObject ){
      Object.keys(key).forEach(function(name){
        config[key] = config[key] || { };
        target = util.merge({ }, key[name]);
        config[key] = target;
      });
      return key;
    }
    return config[key];
  };

  /*
   * Command.parse(prop [,parser])
   * register a property parser
   */

  this.parse = function (prop, parser){
    if(!parser){
      var copy = config.parse[prop];
      return copy;
    }
    if( typeof parser === 'function' ){
      config.parse[prop] = parser;
      return this;
    }
    throw new util.Error(
      'parse(prop, parser): \n'+
      ' When given, parser should be a function'
    );
  };

  /*
   * `aliases` parser
   */
  this.parse('aliases', function (node, stems, opts){
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
  this.parse('completion', function (node, stems, opts){
    opts.completion = util.boil(opts.completion);
    if(!opts.completion.length){  return ;  }

    opts.completion.forEach(function(name){
      node.completion = node.completion || [ ];
      if(node.completion.indexOf(name) < 0){
        node.completion.push(name);
      }
    });
  });
}

/*
 * Command.set(stems [,opts])
 *
 * set a command
 *
 * @param `string/array` stems
 * @param `function` stems
 * @return this
 */

Command.prototype.set = function (stems, opts){

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

  var anchor, node = this.cache;
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
   if(stems[index]){ anchor = node; }
  });

  var config = this.config();
  anchor = anchor || this.cache;
  // if any, process the properties
  Object.keys(opts).forEach(function parseProps(prop){
   if( config.parse[prop] ){
     config.parse[prop].call(this, anchor, stems, opts);
   } else {
     node[prop] = util.clone(opts[prop]);
   }
  }, this);

  return this;
};

/*
 * Command.parse(prop [,parser])
 *
 * register a property parser
 *
 * @param `string` prop
 * @param `function` parser
 *
 * parsers are given the current node and the options
 */

Command.prototype.get = function (stems, opts){
  stems = util.boil(stems); opts = opts || { };
  var shallow = null, index = 0, found = this.cache;
  //--
  debug(' stems ', stems, '\n opts', opts);
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
  //--
  if(opts.ref){ return found; }
  shallow = util.merge({ }, found);
  return shallow;
};
