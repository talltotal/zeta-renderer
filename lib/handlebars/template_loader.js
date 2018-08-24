var fs = require('fs')
var handlebars = require('handlebars')

var FileNotFoundError = require('../errors')

module.exports = {
  fromPathSync: function (path) {
    if (!fs.existsSync(path)) {
      throw new FileNotFoundError(path)
    }
    var template = fs.readFileSync(path, {
      encoding: 'utf-8'
    })
    return handlebars.compile(template)
  },
  fromText: function (text) {
    return handlebars.compile(text)
  }
}
