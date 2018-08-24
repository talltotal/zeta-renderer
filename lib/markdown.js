var hljs = require('highlight.js')
var MarkdownIt = require('markdown-it')

var md = new MarkdownIt({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value
      } catch (__) {}
    }

    return ''
  }
})

module.exports = {
  render: function (str) {
    return md.render(str)
  }
}
