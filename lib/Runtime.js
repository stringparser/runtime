'use strict';

var util = require('./util');
var Stack = require('./Stack');

// refs
var __slice = Array.prototype.slice;

// missing docs
function Runtime (props) {
  if (!(this instanceof Runtime)) {
    return new Runtime(props);
  }

  util.merge(this, props);

  this.Stack = util.createClass(this.Stack, {
    mixins: [ this.constructor, this ],
    create: function CallStack (/* arguments */) {
      CallStack.super_.apply(this, arguments);
    }
  });
}

// missing docs
Runtime.Stack = Runtime.prototype.Stack = Stack;

// missing docs
Runtime.prototype.tree = function (sites) {
  if (!(sites instanceof Stack)) {
    return null;
  }

  var tree = { label: '', nodes: [] };
  var stack = new this.Stack(null);

  for (var i = 0, l = sites.length; i < l; ++i) {
    sites.reduceStack.call(this, stack, sites[i], i, sites);
  }

  for (var j = 0, m = stack.length; j < m; ++j) {
    var site = stack[j];
    if (!site || !site.fn) { continue; }

    var stem = this.tree(site.fn.stack) || {
      label: site.label || site.fn.displayName || site.fn.name
    };

    tree.label += (tree.label && ', ' + stem.label) || stem.label;
    tree.nodes.push(stem);
  }

  return tree;
};

// missing docs
Runtime.prototype.stack = function (/* sites..., props */) {
  var self = this;
  var sites = __slice.call(arguments);
  var props = util.isPlainObject(sites[sites.length - 1]) && sites.pop();

  composer.stack = new this.Stack(sites, props);

  function composer (host, next) {
    var stack = new self.Stack(null, props);

    for (var i = 0, l = sites.length; i < l; ++i) {
      stack.reduceStack.call(self, stack, sites[i], i, sites);
    }

    stack.args = __slice.call(arguments);

    if (typeof arguments[arguments.length - 1] === 'function') {
      stack.onHandleError = stack.onStackEnd = stack.args.pop();
    }

    tick(stack, { index: -1, count: stack.length });
  }

  function tick (stack, o) {
    var site = stack[++o.index];
    var next = util.once(asyncEnd);
    var args = site.fn.stack instanceof Stack
      && stack.args.concat(next) || [next].concat(stack.args);

    next.wait = Boolean(stack.wait);

    util.asyncDone(function asyncStart () {
      stack.onHandleStart.call(self, site, stack);
      var ctxt = site.context || stack.context || site;
      var result = site.fn.apply(ctxt, args);
      if (!next.wait && stack[o.index + 1]) { tick(stack, o); }
      return result;
    }, next);

    function asyncEnd (error) {
      if (error instanceof Error) {
        stack.onHandleError.call(self, error, site, stack, asyncEnd);
        return;
      }

      if (next.wait && arguments.length) {
        util.mapFrom(stack.args, arguments, error && -1 || 0);
      }

      stack.end = !o.count || !(--o.count);
      stack.onHandleEnd.call(self, site, stack);

      if (o.count && stack[o.index + 1]) {
        tick(stack, o);
      } else if (!o.count && stack.onStackEnd) {
        stack.onStackEnd.apply(self, [null].concat(stack.args));
      }
    }
  }

  return composer;
};

// missing docs
exports = module.exports = util.createClass({
  create: Runtime
});
