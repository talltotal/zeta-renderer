var _ = require("lodash");
var handlebars = require("handlebars");

var AsyncRender = (function() {
  function AsyncRender() {
    this.values = {};
    this.callback = void 0;
    this.resolved = false;
    this.count = 0;
    this.idCount = 0;
  }

  AsyncRender.prototype.genId = function() {
    return "__ASYNC_PLACEHOLDER_" + (this.idCount++) + "__";
  };

  AsyncRender.prototype.deferred = function() {
    return ++this.count;
  };

  AsyncRender.prototype.resolve = function(id, value) {
    this.values[id] = value;
    if (--this.count === 0) {
      this.resolved = true;
      return typeof this.callback === "function" ? this.callback() : void 0;
    }
  };

  AsyncRender.prototype.done = function(cb) {
    this.callback = cb;
    if (this.resolved) {
      return this.callback();
    }
  };

  AsyncRender.KEY = "__ASYNC__";

  AsyncRender["do"] = function(t, content, cb) {
    var result;
    if (cb === void 0 && typeof content === "function") {
      cb = content;
      content = {};
    }
    content = content || {};
    if (content[this.KEY] !== void 0) {
      content = _.clone(content);
      content[this.KEY] = void 0;
    }
    try {
      result = t(content);
    } catch (_error) {
      cb(_error);
      return;
    }
    var asyncRender = content[this.KEY];
    if (asyncRender === void 0) {
      return cb(void 0, result);
    } else {
      return asyncRender.done(function() {
        var vals = this.values;
        Object.keys(vals).forEach(function(id) {
          return result = result.replace(id, vals[id].toString());
        });
        return cb(void 0, result);
      });
    }
  };

  AsyncRender.resolve = function(fn, context, args) {
    var asyncRender = context[this.KEY];
    if (asyncRender === void 0) {
      asyncRender = context[this.KEY] = new AsyncRender;
    }
    asyncRender.deferred();
    var id = asyncRender.genId();
    [].push.call(args, function(err, result) {
      if (err) {
        console.error("error when resolve async helper: " + err);
        return asyncRender.resolve(id, "");
      } else {
        return asyncRender.resolve(id, result);
      }
    });
    fn.apply(context, args);
    return id;
  };

  return AsyncRender;

})();

module.exports = {
  "do": AsyncRender["do"].bind(AsyncRender),
  registerAsyncHelper: function(name, fn) {
    return handlebars.registerHelper(name, function() {
      return AsyncRender.resolve(fn, this, arguments);
    });
  }
};

