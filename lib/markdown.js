var hljs = require('highlight.js');
var markdown_it = require('markdown-it');

var md = new markdown_it({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (__) {}
    }
 
    return '';
  }
});

module.exports = {
  render: function(str){
    return md.render(str);
  }
};