(function () {
  var _ = require('lodash')
  var handlebars = require('handlebars')

  var render = require('./render')
  var renderer = require('../index')
  var dataProvider = require('../data_provider')

  handlebars.registerHelper('assign', function (a, options) {
    options.data.root[a] = _.trim(options.fn(this))
    return null
  })

  handlebars.registerHelper('markdown', function (path, options) {
    return new handlebars.SafeString(render.renderMarkdown(path))
  })

  handlebars.registerHelper('inject', function (path, options) {
    var tempContext = _.clone(this)
    _.assign(tempContext, options.hash)
    if (options.fn) {
      var compData = JSON.parse(options.fn(this))
      _.assign(tempContext, compData)
    }
    var dataResult = dataProvider.getCompData(path, tempContext)
    if (dataResult.found) {
      var mockResult = dataResult.result
      var servicesResult = mockResult['_SERVICES_']
      delete mockResult['_SERVICES_']
      var mockContext = {
        _DATA_: mockResult,
        _USER_: renderer.config.user,
        _LOCALE_: renderer.config.language
      }
      if (_.isObject(servicesResult)) {
        _.assign(mockContext, servicesResult)
      }
      _.assign(tempContext, mockContext)
    }
    return new handlebars.SafeString(render.renderComponent(path, tempContext))
  })

  handlebars.registerHelper('component', function (className, options) {
    return new handlebars.SafeString('<div class="' + className + '" data-comp-path="' + this[render.CONST.COMP_PATH] + '">' + (options.fn(this)) + '</div>')
  })

  handlebars.registerHelper('designPart', function () {
    var options = _.last(arguments)
    if (options.fn) {
      return options.fn(this)
    }
  })
}).call(this)
