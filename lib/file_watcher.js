var _ = require('lodash')
var watch = require('node-watch')

module.exports = {
  watchFiles: function (filePaths, callback) {
    if (_.isArray(filePaths)) {
      _.each(filePaths, function (filePath) {
        watch(filePath, callback)
      })
    } else {
      watch(filePaths, callback)
    }
  }
}
