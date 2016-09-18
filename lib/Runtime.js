'use strict';

var util = require('./util');

// refs
var __slice = Array.prototype.slice;
var emptyFn = function () {};

// missing docs
function Runtime (props) {
  if (!(this instanceof Runtime)) {
    return new Runtime(props);
  }

  this.props = util.clone(props, true) || {};
}

// missing docs
Runtime.prototype.onHandleEnd = emptyFn;
Runtime.prototype.onHandleStart = emptyFn;
Runtime.prototype.onHandleError = function (error, site, stack) {
  if (stack.onStackEnd) {
    try {
      stack.onStackEnd.apply(this, arguments);
    } catch (err) { throw err; }
  } else {
    throw error;
  }
};

// missing docs
Runtime.prototype.reduceStack = function (stack, site) {
  if (typeof site === 'function') {
    stack.push({ fn: site });
  } else if (site && typeof site.fn === 'function') {
    stack.push(util.clone(site, true));
  }
  return stack;
}

// missing docs
Runtime.prototype.stack = function (/* sites..., props */) {
  var self = this;
  var sites = __slice.call(arguments);
  var props = sites.props = util.merge({}, this.props,
    util.isPlainObject(sites[sites.length - 1]) && sites.pop()
  );

  composer.stack = sites;

  function composer (host, next) {
    var stack = util.merge([], { props: props });

    for (var i = 0, l = sites.length; i < l; ++i) {
      self.reduceStack(stack, sites[i], i, sites);
    }

    stack.args = __slice.call(arguments);
    stack.index = -1;
    stack.count = stack.length;

    if (typeof arguments[arguments.length - 1] === 'function') {
      stack.onStackEnd = stack.args.pop();
    }

    tick(stack);
  }

  function tick (stack) {
    var site = stack[++stack.index];
    if (!site || !site.fn) { return; }

    var next = util.once(asyncEnd);
    var args = Array.isArray(site.fn.stack)
      && stack.args.concat(next) || [next].concat(stack.args);

    next.wait = Boolean(stack.props.wait);

    util.asyncDone(function asyncStart () {
      self.onHandleStart(site, stack);
      var ctxt = site.context || stack.props.context || site;
      var result = site.fn.apply(ctxt, args);
      if (!next.wait && stack[stack.index + 1]) {
        tick(stack);
      }
      return result;
    }, next);

    function asyncEnd (error) {
      if (error instanceof Error) {
        return self.onHandleError(error, site, stack, asyncEnd);
      }

      if (next.wait && arguments.length) {
        util.mapFrom(stack.args, arguments, error && -1 || 0);
      }

      stack.end = !stack.count || !(--stack.count);
      self.onHandleEnd(site, stack);

      if (stack.count) { tick(stack); } else if (stack.onStackEnd) {
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
