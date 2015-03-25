'use strict';

exports = module.exports = completer;

// ## completer(app, line, callback)
// > produce the completion array asynchronously
//
// arguments
//  - app, a `runtime` instance
//  - line, `string`, passed from readline's `line` event
//  - callback, `function` passed from readline's
//
// returns undefined
//
// --
// api.private
// --

function completer(app, line, callback){
  var hits = [ ];
  var match = line.match(/[ ]+\S+$|[ ]+$/);
  var completion = getCompletion(app, line);

  if(match){ // start hits at last word
    line = line.substring(match.index, line.length).trim();
  }

  hits = completion.filter(function(elem){
    return !elem.indexOf(line);
  });

  callback(null, [hits.length ? hits : completion, line]);
}

// ## getCompletion(app, line)
// > get completion for the current command
//
// arguments
//  - app, a `runtime` instance
//  - line, `string`, passed from readline's `line` event
//
// return
//  - completion for that node command
//
// --
// api.private
// --
//
function getCompletion(app, line){
  var cmd = app.get(line, {ref: true});
  var completion = Object.keys(app.store.children || {});
  if(cmd === app.store || !cmd.parent || cmd.parent === app.store){
    return completion.filter(function(item){
      return line.indexOf(item) < 0;
    });
  }

  return (
    Object.keys(cmd.parent.children || {})
     .concat(completion)
     .filter(function(item){
       return line.indexOf(item) < 0;
    })
  );

}

// ## pathlete(partial, complete)
// > complete file paths
//
// arguments
//  - partial: path partial to complete
//  - complete: the completion array obtained in getCompletion
//
// return
//  - completion for the given path
//
// --
// api.private
// --
//
// function pathlete(partial, complete){
//   var cwd = process.cwd();
//   if( !complete.length ){
//     complete = fs.readdirSync(cwd).filter(function(pathname){
//       return !(/^\.|node_modules/i).test(pathname);
//     });
//     complete.push('..');
//   }
//   //
//   // return early for
//   //  - no matches
//   //  - something with extension
//   //  - path does not match initial basedirs
//   //
//   partial = (partial || '').trim();
//   var index;
//   var basedir = partial.split(path.sep)[0];
//   var resolved = path.resolve(cwd, partial);
//   if( path.extname(partial) ){  return complete;  }
//   if( complete.indexOf(partial) > -1 ){ return complete; }
//   if( (index = complete.indexOf(basedir)) < 0 ){  return complete;  }
//
//   try {
//     var lstat = fs.lstatSync(resolved);
//     if( !lstat.isDirectory() ){  return complete;  }
//   } catch(err){ return complete; }
//   // or didn't exist or wasn't a directory
//   // not useful to throw for tab completion
//
//   var notEmpty = false;
//   fs.readdirSync(resolved)
//   .forEach(function(pathname){
//     if( complete.indexOf(pathname) > -1 ){  return ;  }
//     complete.push(path.join(partial, pathname));
//     notEmpty = true;
//   });
//   complete[index] += path.sep;
//   return complete;
// }
