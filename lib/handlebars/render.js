(function() {
  var _ = require("lodash");
  var fs = require("fs");
  var handlebars = require("handlebars");

  var templateLoader = require("./template_loader");
  var fileWatcher = require("../file_watcher");
  var env = require("../enviroments");
  var FileNotFoundError = require("../errors");

  // 注册 helper
  require("./helpers");

  // 注册额外的helper
  env.extraHelpers.forEach(function(helperPath) {
    var e;
    try {
      require(helperPath)(handlebars);
    } catch (_error) {
      var e = _error;
      console.error("error when load extra helper file: " + helperPath, e);
    }
  });

  // 注册用于 layout 的 helper
  var blocks = {};

  handlebars.registerHelper("partial", function(name, options) {
    var block;
    if (!(block = blocks[name])) {
      block = blocks[name] = [];
    }
    block.push(options.fn(this));
    return void 0;
  });

  handlebars.registerHelper("block", function(name, options) {
    var block, content;
    block = blocks[name] || [];
    if (block.length === 0) {
      if (options.fn) {
        return options.fn(this);
      } else {
        return "";
      }
    } else {
      content = block.join("\n");
      blocks[name] = [];
      return content;
    }
  });

  var registerLayout = function(filePath) {
    if (!/\.hbs$/.test(filePath)) {
      return;
    }
    var t = fs.readFileSync(filePath);
    var name = filePath.slice(env.viewsHome.length + 1).split(".")[0];
    if (env.oldMode) {
      name = "views/" + name;
    }
    return handlebars.registerPartial(name, handlebars.compile(t.toString()));
  };

  var layouts = [];

  // 找到所有 layout 路径
  var findLayouts = function(dir) {
    var files = fs.readdirSync(dir);
    files.forEach(function(file) {
      var filePath = "" + dir + "/" + file;
      if (fs.statSync(filePath).isDirectory()) {
        findLayouts(filePath);
      } else {
        layouts.push(filePath);
      }
    });
  };

  findLayouts(env.viewsHome);

  layouts.forEach(function(file) {
    registerLayout(file);
  });

  fileWatcher.watchFiles(env.viewsHome, function(filePath) {
    if (!fs.existsSync(filePath)) {
      return;
    }
    if (fs.statSync(filePath).isDirectory()) {
      return;
    }
    try {
      registerLayout(filePath);
      console.log("[Layout Reload] " + filePath);
    } catch (_error) {
      var err = _error;
      console.log("Layout Reload Error] " + filePath + " - " + err);
    }
  });

  var normalizePath = function(path) {
    if (path[0] === "/") {
      return path.slice(1);
    } else {
      return path;
    }
  };

  var getRealPath = function(path) {
    if (env.pageMode) {
      return "" + env.viewsHome + "/" + (normalizePath(path)) + "/view.hbs";
    } else {
      return "" + env.viewsHome + "/" + (normalizePath(path)) + ".hbs";
    }
  };

  var getComponentViewPath = function(path) {
    return "" + env.componentsHome + "/" + (normalizePath(path)) + "/view.hbs";
  };

  var renderFromRealPath = function(path, context) {
    var template = templateLoader.fromPathSync(path);
    return template(context);
  };

  module.exports = {
    renderFile: function(path, context) {
      return renderFromRealPath(getRealPath(path), context);
    },
    renderComponent: function(path, context) {
      context = context || {};
      context[this.CONST.COMP_PATH] = path;
      try {
        return renderFromRealPath(getComponentViewPath(path), context);
      } catch (_error) {
        var err = _error;
        if (err instanceof FileNotFoundError) {
          console.log("[Component Not Found] " + err.path);
          return "component view not found: " + err.path;
        } else {
          throw err;
        }
      }
    },
    CONST: {
      COMP_PATH: "COMP_PATH"
    }
  };

  require("./render_helpers");

}).call(this);
