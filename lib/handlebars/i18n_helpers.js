(function () {
  var handlebars = require('handlebars')
  var renderer = require('../index')
  var path = require('path')
  var yaml = require('js-yaml')
  var fs = require('fs')

  handlebars.registerHelper('i18n', function (key, options) {
    var tempPath = options.hash.bundle
    var filePath = path.resolve(renderer.config.resourcesHome, tempPath || 'messages')
    try {
      var doc
      var value
      if (fs.existsSync(filePath + '/' + renderer.config.language + '.yaml')) {
        doc = yaml.safeLoad(fs.readFileSync(filePath + '/' + renderer.config.language + '.yaml', 'utf8'))
        value = doc[key]
      }
      return value || key
    } catch (e) {
      console.log(e)
      return key
    }
  })

  handlebars.registerHelper('i18nJs', function () {
    return ''
  })

  handlebars.registerHelper('i18nJsHelper', function () {
    return new handlebars.SafeString('if (window.Handlebars) {Handlebars.registerHelper("i18n", function(key) {return key;});}')
  })
}).call(this)
