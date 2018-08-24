var fs = require('fs')
var handlebars = require('handlebars')

var md = require('../markdown')
var templateLoader = require('./template_loader')
var fileWatcher = require('../file_watcher')
var env
var FileNotFoundError = require('../errors')

// 注册用于 layout 的 helper
var blocks = {}
var layouts = []
var components = []

var Render = function (options) {
  env = options
  // 注册 helper
  require('./helpers')
  require('./render_helpers')

  // 注册额外的helper
  env.extraHelpers.forEach(function (helperPath) {
    try {
      require(helperPath)(handlebars)
    } catch (_error) {
      console.error('error when load extra helper file: ' + helperPath, _error)
    }
  })

  handlebars.registerHelper('partial', function (name, options) {
    var block
    if (!(block = blocks[name])) {
      block = blocks[name] = []
    }
    block.push(options.fn(this))
    return void 0
  })

  handlebars.registerHelper('block', function (name, options) {
    var block, content
    block = blocks[name] || []
    if (block.length === 0) {
      if (options.fn) {
        return options.fn(this)
      } else {
        return ''
      }
    } else {
      content = block.join('\n')
      blocks[name] = []
      return content
    }
  })

  findHbsFiles(layouts, env.viewsHome)
  findHbsFiles(components, env.componentsHome)

  layouts.forEach(function (file) {
    registerLayout(file)
  })

  components.forEach(function (file) {
    registerComponent(file)
  })

  watchHbsFiles(env.viewsHome, registerLayout)
  watchHbsFiles(env.componentsHome, registerComponent)
}

var registerLayout = function (filePath) {
  if (!/\.hbs$/.test(filePath)) {
    return
  }
  var t = fs.readFileSync(filePath)
  var name = filePath.slice(env.viewsHome.length + 1).split('.')[0]
  if (env.oldMode) {
    name = 'views/' + name
  }
  return handlebars.registerPartial(name, handlebars.compile(t.toString()))
}

var registerComponent = function (filePath) {
  if (!/\.hbs$/.test(filePath)) {
    return
  }
  var t = fs.readFileSync(filePath)
  var name = filePath.slice(env.componentsHome.length + 1).split('.')[0]
  return handlebars.registerPartial('component:' + name, handlebars.compile(t.toString()))
}

var watchHbsFiles = function (dir, callback) {
  fileWatcher.watchFiles(dir, function (filePath) {
    if (!fs.existsSync(filePath)) {
      return
    }
    if (fs.statSync(filePath).isDirectory()) {
      return
    }
    try {
      filePath = filePath.replace(/(\\)|(\\\\)/g, '/')
      callback(filePath)
    } catch (_error) {
      var err = _error
      console.log('Component Reload Error] ' + filePath + ' - ' + err)
    }
  })
}

// 找到所有路径下的 hbs 路径
var findHbsFiles = function (_object, dir) {
  var files = fs.readdirSync(dir)
  files.forEach(function (file) {
    var filePath = '' + dir + '/' + file
    if (fs.statSync(filePath).isDirectory()) {
      findHbsFiles(_object, filePath)
    } else if (filePath.split('.')[filePath.split('.').length - 1] === 'hbs') {
      _object.push(filePath)
    }
  })
}

var normalizePath = function (path) {
  if (path[0] === '/') {
    return path.slice(1)
  } else {
    return path
  }
}

var getRealPath = function (path) {
  if (env.pageMode) {
    return '' + env.viewsHome + '/' + (normalizePath(path)) + '/view.hbs'
  } else {
    return '' + env.viewsHome + '/' + (normalizePath(path)) + '.hbs'
  }
}

var getComponentViewPath = function (path) {
  return '' + env.componentsHome + '/' + (normalizePath(path)) + '/view.hbs'
}

var renderFromRealPath = function (path, context) {
  var template = templateLoader.fromPathSync(path)
  return template(context)
}

Render.renderFile = function (path, context) {
  return renderFromRealPath(getRealPath(path), context)
}

Render.renderComponent = function (path, context) {
  context = context || {}
  context[this.CONST.COMP_PATH] = path
  try {
    return renderFromRealPath(getComponentViewPath(path), context)
  } catch (_error) {
    var err = _error
    if (err instanceof FileNotFoundError) {
      return 'component view not found: ' + err.path
    } else {
      throw err
    }
  }
}

Render.renderMarkdown = function (path) {
  var realPath = env.componentsHome + '/' + (normalizePath(path)) + '.md'
  var data = fs.readFileSync(realPath)
  return md.render(data.toString())
}

Render.CONST = {
  COMP_PATH: '_COMP_PATH_'
}

module.exports = Render
