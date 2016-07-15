(function() {
  var handlebars = require("handlebars");

  handlebars.registerHelper("i18n", function(key, options) {
    return key;
  });

  handlebars.registerHelper("i18nJs", function() {
    return "";
  });

  handlebars.registerHelper("i18nJsHelper", function() {
    return new handlebars.SafeString('if (window.Handlebars) {Handlebars.registerHelper("i18n", function(key) {return key;});}');
  });

}).call(this);
