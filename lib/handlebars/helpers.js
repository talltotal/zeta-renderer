(function() {
  var _ = require("lodash");
  var handlebars = require("handlebars");
  var moment = require("moment");

  require("./i18n_helpers");

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

  handlebars.registerHelper("formatPrice", function(price, type, options) {
    var formatedPrice, roundedPrice;
    if (price == null) {
      return;
    }
    if (type === 1) {
      formatedPrice = price / 100;
      roundedPrice = parseInt(price / 100);
    } else {
      formatedPrice = (price / 100).toFixed(2);
      roundedPrice = parseInt(price / 100).toFixed(2);
    }
    if (formatedPrice == roundedPrice) {
      return roundedPrice;
    } else {
      return formatedPrice;
    }
  });

  handlebars.registerHelper("formatDate", function(date, type, options) {
    if (!date) {
      return;
    }
    switch (type) {
      case "gmt":
        return moment(date).format("EEE MMM dd HH:mm:ss Z yyyy");
      case "day":
        return moment(date).format("YYYY-MM-DD");
      case "minute":
        return moment(date).format("YYYY-MM-DD HH:mm");
      default:
        if (typeof type === "string") {
          return moment(date).format(type);
        } else {
          return moment(date).format("YYYY-MM-DD HH:mm:ss");
        }
    }
  });

  handlebars.registerHelper("assign", function(a, options) {
    options.data.root[a] = options.fn;
    return null;
  });

  handlebars.registerHelper("of", function(a, b, options) {
    if (typeof b === 'string') {
      b = b.split(',')
    }
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

  handlebars.registerHelper("lt", function(a, b, options) {
    if (a < b) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

  handlebars.registerHelper('length', function(a, options) {
    var length;
    return length = a.length;
  });

  handlebars.registerHelper('gtTime', function(a, b, options) {
    var benchmarkTime, nowTime;
    nowTime = moment();
    switch (b) {
      case "dayStart":
        benchmarkTime = new Date(nowTime.format("YYYY-MM-DD")).valueOf();
        break;
      case "now":
        benchmarkTime = nowTime.valueOf();
        break;
      case "dayEnd":
        benchmarkTime = new Date(moment().date(nowTime.date() + 1).format("YYYY-MM-DD")).valueOf();
        break;
      default:
        benchmarkTime = moment(b).valueOf();
    }
    if (moment(a).valueOf() > benchmarkTime) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

  handlebars.registerHelper("isArray", function(a, options) {
    if (_.isArray(a)) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

  handlebars.registerHelper("between", function(a, b, c, options) {
    if (a >= b && a <= c) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

  handlebars.registerHelper("addStar", function(userName) {
    if (userName.length >= 2) {
      return userName.charAt(0) + "***" + userName.charAt(userName.length - 1);
    }
  });

  handlebars.registerHelper("withPerm", function(resource) {
    var authResources;
    authResources = window.resource;
    if (authResources.length === 1 && authResources[0] === "") {
      return options.fn(this);
    } else if (_.contains(authResources, resource)) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

  handlebars.registerHelper("divide", function(a, b, options) {
    return a / (options ? b : 100);
  });

  handlebars.registerHelper("multi", function(a, b, options) {
    return a * (options ? b : 100);
  });

  handlebars.registerHelper("urlEncode", function(a, options) {
    return encodeURIComponent(a);
  });

  handlebars.registerHelper('isEmpty', function(a, options) {
    if (_.isArray(a) && a.length !== 0) {
      return options.inverse(this);
    } else {
      return options.fn(this);
    }
  });

  handlebars.registerHelper("equalsRemainder", function(a, b, c, options) {
    if ((a + 1) % b === c) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

  handlebars.registerHelper('splitter', function(a, b, c, options) {
    if (typeof a === "string") {
      return a.split(b)[c];
    }
  });
}).call(this);
