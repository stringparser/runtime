/*
 * Module dependencies
 */

var util = require('../utils');
var merge = util.merge;

/*
 * Command constructor
 *
 * @params {Object} config
 * @returns {Object} command instance
 *
 * @api: private
 */

exports = module.exports = function(options){

  var config = options;
  config = ( !Array.isArray(config) && Object(config) === config ) ? config : { };
  config.nested = util.isBoolean(config.nested) ? config.nested : true;

  var name = config.name || '#root';
  var root = {
         _name : name,
        _depth :  0,
        plugin : { },
       aliases : { },
      children : { },
    completion : [ ]
  };
  var anchor = root;
  var found = root;
  var forbid = ['set', 'get', 'value', 'completion']

  /*
   * command as a config wrapper
   *
   * @param  {Object}   obj
   * @return {Function} this.config
   */

  var command = function(obj){
    return this.config(obj);
  };

  /*
   * command prototype
   */

  command.plug = function(name, handle){

    var plugin = root.plugin[name];
    var isString = util.isString(name);
    var isObject = util.isObject(name);

    if( !isString && !isObject )
      throw new Error('plugin `name` should be a `string` or an `object`');

    if( isString && typeof handle !== 'function' )
      throw new Error('if given, plugin `handle` should be a `function`');


    if( isString && handle && forbid.indexOf(name) > -1 )
      throw new Error('plugin name can\'t override these: `'+forbid.join(',')+'`');

    if( handle ) {

      root.plugin[name] = handle;

      var self = this;
      Object.defineProperty(this, name, {
          enumerable : true,
        configurable : true,
        set : function(newHandle){
         this.plug(name, newHandle);
        },
        get : function(){

          return (function(/* arguments */){
            var args = [].slice.call(arguments);
            return self[name].apply(self, args.concat(found));
          });
        }
      });

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

  command.set = function (name, handle){

    isCommand(name, handle);
    name = Array.isArray(name) ? name : [name];
    name[0] = name[0].trim();

    var node = name[0][0] === '-' ? root : anchor;

    if(name.length === 1){

      setCommand(node, name[0], handle);

    } else {

      setCommand(node, name[0], handle);
      name.slice(1).forEach(function(stem){

        stem = stem.trim();
        node.aliases[stem] = name[0];

        if(node.completion.indexOf(stem) === -1){
          node.completion.push(stem);
        }

      });
    }

    return this;
  };

  /*
   * doc holder
   */
  command.get = function(/* arguments */){

       found = root;
    var args = [].slice.call(arguments);

    if(args.length === 0){
      anchor = root;
      return this;
    }

    args = args.filter(function(arg){

      if(found && found.aliases[arg])
        found = found.children[found.aliases[arg]];
      else if(found && found.children[arg])
        found = found.children[arg];
      else
        return false;

      if(found)
        return true;
    });

    anchor = found;

    if(args.length === 0)
      found = null;

    return this;
  };

  command.plug('value', function(found){

    var copy = merge({}, found);
    return copy;
  });

  /*
   * doc holder
   */
  command.completion = function(stems){

    var arr = stems;
    if(typeof stems === 'function'){
        arr = stems();
    }

    var areStrings = arr.filter(function(el){
      return !util.isString(el);
    }).length === 0;

    var node = anchor._name[0] === '-' ? root : anchor;

    if(!areStrings){
      throw new Error(
        '\n\n'+
        '  At `'+command._name+'` runtime, for `'+node._name+'.completion` \n\n'+
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
  };

  /*
   * doc holder
   */
  command.handle = function(handle, found){

    if(typeof handle === 'function')
      found.handle = handle;
    else
      throw new Error(
        ' For `'+found._name+'`.handle : \n'+
        '  - Unsupported type. A handle should be a function\n'
      );

    return this;
  };

  /*
   *
   */
  command.version = function(number, comment, found){

    var version = root.version = {};

    if(number){
      merge(version, { number : number });
    }

    if(comment){
      merge(version, { comment : comment });
    }

    return this;
  };

  /*
   *
   */
  command.log = function(){
    console.log('root = \n', root);
    console.log('anchor = \n', anchor);
    console.log('found = \n', found);
    return this;
  };

  /*
   *
   */

  function setCommand(node, name, handle){

    if(node.completion.indexOf(name) === -1){

      node.children[name] = {
            _name : name,
           _depth : node._depth+1,
          _parent : node._name,
          aliases : {},
         children : {},
       completion : []
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

  var ordered = { };
  Object.keys(command).sort(function(a,b){
    return a.length-b.length;
  }).forEach(function(key){
    ordered[key] = command[key];
  })
  return ordered;
};
