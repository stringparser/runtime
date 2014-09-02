/*
 * Module dependencies
 */

var util = require('../utils');
var config = require('../config');

var merge = util.merge;

/*
 * Command constructor
 *
 * @params {Object} options
 * @returns {Object} command instance
 *
 * @api: private
 */

exports = module.exports = function(options){

  options = util.isObject(options) ? options : { };
  options.nested = util.isBoolean(options.nested) ? options.nested : true;
  options.forbid = typeof options.forbid === 'string' ? [options.forbid] : options.forbid;

  var root = {
         _name : options.name || '#root',
        _depth :  0,
        plugin : { },
       aliases : { },
      children : { },
    completion : [ ]
  };
  var found = root;
  var anchor = root;
  var forbid = ['set', 'get'];
  var shared = [ found ];

  if( options.shared && Array.isArray(options.shared) )
    shared = shared.concat(options.shared);

  if( options.forbid && areStrings(options.forbid) )
    forbid = forbid.concat(options.forbid);

  /*
   * command as a config wrapper
   *
   * @param  {Object}   obj
   * @return {Function} this.options
   */

  var command = function(obj){
    return this.config(obj);
  };

  command.config = config();

  /*
   * command prototype
   */

  /*
   * doc holder
   */

  command.plug = function(name, handle){

    var isString = util.isString(name);
    var isObject = util.isObject(name);

    if( !isString && !isObject )
      throw new Error('plugin `name` should be a `string` or an `object`');
    else if( isString && handle ){

      if(typeof handle !== 'function')
        throw new Error('if given, plugin `handle` should be a `function`');

      if(forbid.indexOf(name) > -1)
        throw new Error('plugin name can\'t override these: \n - `'+forbid.join('`\n - `')+'');
    }


    if( handle ) {

      root.plugin[name] = handle;
      var self = this;
      this[name] = function(/* arguments */){
        var args = [].slice.call(arguments);
        return handle.apply(self, args.concat(shared));
      };

    } else if( isObject )  {

      Object.keys(name).forEach(function(key){
        this.plug(key, name[key]);
      }, this);
    }

    return this;
  };

  /*
   * doc holder
   */

   command.set = function (/* arguments */){

    var args = [].slice.call(arguments);
    var stems, aliases, handle;

    if( typeof args[args.length-1] === 'function' )
      handle = args.pop();

    if( util.isString(args[0]) ){
      stems = args[0].trim().split(/[ ]+/);
    } else if( Array.isArray(args[0]) ){
      aliases = args.shift();
      stems = aliases.splice(0,1);
    } else {
      throw new Error('first argument should be a `string` or an `array` of `strings`');
    }

    // find the anchor
    this.get(stems);

    var len = stems.length;
    stems.forEach(function(stem, index){

      stem = stem.trim();
      var node = stem[0] === '-' ? root : anchor;

      if( index < len-1 )
        setCommand(node, stem);
      else
        setCommand(node, stem, handle);

      if( stem[0] !== '-')
        anchor = anchor.children[stem];
    });


    if( aliases ){

      var main = stems[0].trim();
      var node = main[0] === '-' ? root : anchor;
          node.aliases = node.aliases || { };

      aliases.forEach(function(stem){

        stem = stem.trim();
        node.aliases[stem] = main;
        if(node.completion.indexOf(stem) < 0){
          node.completion.push(stem);
        }
      });
    }

    return this;
  };

  /*
   * doc holder
   */
  command.get = function(stems /*, arguments*/){

    var copy, args;

    if( stems === void 0 ){
      copy = merge({ }, anchor);
      return copy;
    } else if( util.isString(stems) ){
      args = stems.trim().split(/[ ]+/);
    } else {
      args = Array.isArray(stems) ? stems : [ ].slice.call(arguments);
    }

    found = root;
    args.filter(function(arg){

      if(found.aliases && found.aliases[arg])
        found = found.children[found.aliases[arg]];
      else if(found.children && found.children[arg])
        found = found.children[arg];
      else
        return false;

      if(found)
        return true;
    });

    if( util.isString(stems) ){
      anchor = found;
      return this;
    } else {
      copy = merge({ }, found);
      return copy;
    }

  };

  /*
   * doc holder
   */
  command.plug('completion', function(stems){

    var arr = stems;
    if(typeof stems === 'function'){
        arr = stems();
    }

    this.get();
    var node = anchor._name[0] === '-' ? root : found;

    if(!areStrings(arr)){
      throw new Error(
        '\n\n'+
        '  At `'+root._name+'` runtime, for `'+node._name+'.completion` \n\n'+
        '  Unsupported type. Completion should either be:\n\n'+
        '   - An Array\n'+
        '   - A Function returning an Array\n'
      );
    }

    arr.forEach(function(stem){
      if(node.completion.indexOf(stem) === -1)
         node.completion.push(stem);
    });

    return this;
  });

  /*
   * doc holder
   */
  command.plug('handle', function(handle, found){

    if(typeof handle === 'function')
      found.handle = handle;
    else
      throw new Error(
        ' For `'+found._name+'`.handle : \n'+
        '  - Unsupported type. A handle should be a function\n'
      );

    return this;
  });

  /*
   *
   */
  command.plug('version', function(number, comment, found){

    var version = found.version = { };

    if(number)
      merge(version, { number : number });

    if(comment)
      merge(version, { comment : comment });

    return this;
  });

  return command;
};

function setCommand(node, name, handle){

  if(node.completion.indexOf(name) === -1){

    node.children[name] = {
         _depth : node._depth+1,
        _parent : node._name,
       children : { },
     completion : [ ]
    };

    node.completion.push(name);

    if( typeof handle === 'function' )
      node.children[name].handle = handle;
  }
}

/*
 *
 */

function isCommand(name, handle){

  if(Array.isArray(name)){

    name.forEach(function(stem){

      if(!Array.isArray(stem)){
        isCommand(stem, handle);
      } else {
        throw new Error(' Don\'t nest arrays for command names.');
      }
    });

  } else if( typeof name !== 'string' ){

    throw new Error(
      'Command "'+name+"' should be a `string` or an `array`."
    );

  } else if(!name){

    throw new Error('Falsey commands like "'+name+'" are not allowed.');
  }
}


/*
 *
 */

function areStrings(arr){

  if( !Array.isArray(arr) ){
    return false;
  } else {
    return arr.filter(function(elem){
      return util.isString(elem);
    }).length === arr.length;

  }
}
