(function() {
  var _ = require("lodash");
  var handlebars = require("handlebars");
  var moment = require("moment");

  require("./i18n_helpers");

  handlebars.registerHelper("helperMissing", function() {
    return "missing helper";
  });


  handlebars.registerHelper("cdnPath", function(path, options) {
    if (path == null) {
      return "http://zcy-dev.img-cn-hangzhou.aliyuncs.com/system/error/image_not_found.001.jpeg";
    }
    if (options.params != null && options.params.length != 0) {
      if (!path.match("aliyuncs.com")) {
        return path;
      } else {
        return path + "@" + options.replace(/,/g, "_");
      }
    }
    return path;
  });

  handlebars.registerHelper("formatPrice", function(price, options) {
    return (Number(price)/100).toFixed(2);
  });

  handlebars.registerHelper("formatDate", function(mills) {
    return moment(mills).format("YYYY-MM-DD HH:mm:ss");
  });

  handlebars.registerHelper("assign", function(a, options) {
    console.log(options.fn);
    options.data.root[a] = options.fn;
    return null;
  });

  handlebars.registerHelper("of", function(a, b, options) {
    if (b && b.length > 0) {
      for(var i = 0; i < b.length; i++){
        if (a == b[i]) {
          return options.fn(this);
        }
      }
    }
    return options.inverse(this);
  });

  handlebars.registerHelper("add", function(a, b, options) {
      return Number(a)+Number(b);
  });


  handlebars.registerHelper("equals", function(a, b, options) {
    if ((a != null ? a.toString() : void 0) === (b != null ? b.toString() : void 0)) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

  handlebars.registerHelper("gt", function(a, b, options) {
    if (parseFloat(a) > parseFloat(b)) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

  handlebars.registerHelper("and", function(a, b, options) {
    if ((a != null) && (b != null)) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

  handlebars.registerHelper("neither", function(a, b, options) {
    if (!a && !b) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

  handlebars.registerHelper("mod", function(a, b, options) {
    if ((a + 1) % b !== 0) {
      return options.inverse(this);
    } else {
      return options.fn(this);
    }
  });

  handlebars.registerHelper("pp", function(options) {
    return JSON.stringify(this);
  });

  handlebars.registerHelper("json", function(a, options) {
    return JSON.stringify(a);
  });

  handlebars.registerHelper("size", function(a, options) {
    if (a === void 0) {
      return 0;
    }
    if (a.length) {
      if (_.isFunction(a.length)) {
        return a.length();
      } else {
        return a.length;
      }
    }
    if (a.size) {
      if (_.isFunction(a.size)) {
        return a.size();
      } else {
        return a.size;
      }
    }
    return 0;
  });

  handlebars.registerHelper("ifCond", function(v1, operator, v2, options) {
    var isTrue = (function() {
      switch (operator) {
        case "==":
          return v1 == v2;
        case "!=":
          return v1 != v2;
        case "===":
          return v1 === v2;
        case "!==":
          return v1 !== v2;
        case "&&":
          return v1 && v2;
        case "||":
          return v1 || v2;
        case "<":
          return v1 < v2;
        case "<=":
          return v1 <= v2;
        case ">":
          return v1 > v2;
        case ">=":
          return v1 >= v2;
        default:
          return eval("" + v1 + operator + v2);
      }
    })();
    if (isTrue) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

}).call(this);
