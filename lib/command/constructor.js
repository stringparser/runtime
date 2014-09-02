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

  if( options.forbid )
    forbid = boilArray(options.forbid).concat(options.forbid);

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

    var args = arguments;
    var stems, aliases, handle;

    if( typeof args[args.length-1] === 'function' )
      handle = [].pop.call(args);

    if( args.length === 1 && util.isString(args[0]) ){
      stems = args[0].trim().split(/[ ]+/);
    } else if( args.length === 1 && Array.isArray(args[0]) ){
      aliases = boilArray([].shift.call(args));
      stems = aliases.splice(0,1);
    } else {
      stems = boilArray([].slice.call(args));
    }

    // find the corresponding anchor
    anchor = root;
    this.get(stems);
    if( aliases ){

      var main = stems[0].trim();
      var node = main[0] === '-' ? root : anchor;
          node.aliases = node.aliases || { };

      setCommand(node, main, handle);

      aliases.forEach(function(stem){

        stem = stem.trim();
        node.aliases[stem] = main;
        if(node.completion.indexOf(stem) < 0){
          node.completion.push(stem);
        }
      });

      return this;
    }

    var len = stems.length;
    if( len > 1 ){

      stems[0] = stems[0].trim();
      this.get(stems);
      setCommand(anchor, stems[0], handle);
      
      stems.slice(1).forEach(function(stem, index){

        stem = stem.trim();
        this.get(stems.slice(0,index+1));

        if( index < len-2 )
          setCommand(anchor, stem);
        else
          setCommand(anchor, stem, handle);

      }, this);

    } else {

      stems[0] = stems[0].trim();
      this.get(stems);
      setCommand(anchor, stems[0], handle);
    }

    return this;
  };

  /*
   * doc holder
   */
  command.get = function(/* arguments */){

    var copy, args = arguments;
    var stems = args[0], len = args.length;

    if( stems === void 0 ){
      copy = merge({ }, root);
      return copy;
    }

    if( util.isString(stems) && len === 1 )
      args = stems.trim().split(/[ ]+/);
    else
      args = boilArray( Array.isArray(stems) ? stems : [].slice.call(args) );

    found = root;
    args.forEach(function(arg){

      if(found.aliases && found.aliases[arg])
        found = found.children[found.aliases[arg]];
      else if(found.children && found.children[arg])
        found = found.children[arg];
    });
    anchor = found;

    if( util.isString(stems) && len === 1 ) return this;
    else {
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

    boilArray(arr, 'array/function').forEach(function(stem){
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

  /*
   *
   */

  function boilArray(arr, type){

    if( !Array.isArray(arr) ){
      throw new Error('expecting 1st arg to be a `string` or `array` with `string` content');
    } else {

      var test = arr.filter(function(elem){
        return util.isString(elem);
      }).length === arr.length;

      if(test) return arr;
      else if( type === 'array/function' ){

        throw new Error(
          '\n\n'+
          '  At `'+root._name+'` runtime, for `'+node._name+'.completion` \n\n'+
          '  Unsupported type. Completion should either be:\n\n'+
          '   - An Array\n'+
          '   - A Function returning an Array\n'
        );

      } else
        throw new Error('first arg should be a `string` or array of `strings`');
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

  return command;
};

function setCommand(node, name, handle){

  if(node.completion.indexOf(name) < 0){

    node.children[name] = {
          _name : name,
         _depth : node._depth+1,
        _parent : node._name,
       children : { },
     completion : [ ]
    };

    node.completion.push(name);
  }

  if( handle )
    node.children[name].handle = handle;
}
