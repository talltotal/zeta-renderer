require('./polyfill')

var _ = require('lodash')
var fs = require('fs')
var path = require('path')
var express = require('express')
var bodyParser = require('body-parser')
var yaml = require('js-yaml')

var md = require('./markdown')
var render = require('./handlebars/render')
var dataProvider = require('./data_provider')

Renderer.config = {
  port: 8080,
  indexView: 'index',
  errorView: 'error',
  filesHome: 'public',
  viewsHome: void 0,
  componentsHome: void 0,
  resourcesHome: void 0,
  testHome: void 0,
  dataFiles: [],
  extraHelpers: [],
  oldMode: false,
  pageMode: false,
  assetsPrefix: void 0,
  user: void 0
}
var env = process.env.NODE_ENV || 'dev'

function Renderer (options) {
  var app = express()

  /* 设置默认配置 */
  _.assign(Renderer.config, options)

  /* 设置各资源文件绝对路径 */
  enviroment()

  /* 将数据文件内容放入缓存备用 */
  dataProvider(Renderer.config.dataFiles, Renderer.config.testHome)
  /* 设置hbs渲染配置 */
  render(Renderer.config)

  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())

  // set language
  app.use(function (req, res, next) {
    var defaultLang = 'zh_CN'
    var localFileName = 'locales.yaml'

    // 定义规定语言类型
    var transLanguage = {}
    transLanguage['en_US'] = 'en_US|en_us|en-US|en-us|en'
    transLanguage['zh_CN'] = 'zh_CN|zh_cn|zh-CN|zh-cn|zh'

    // 站点支持的语言
    var support = yaml.safeLoad(fs.readFileSync(Renderer.config.resourcesHome + '/' + localFileName))

    var supportExp = []
    for (var i = support.length - 1; i >= 0; i--) {
      supportExp.push(transLanguage[support[i]])
    }
    supportExp = supportExp.join('|')

    // 从请求头上获取匹配的语言类型
    var matchLang = req.header('accept-language') ? req.header('accept-language').match(new RegExp(supportExp)) : null

    // 翻译成规定语言类型
    if (!!matchLang && matchLang.length > 0) {
      matchLang = matchLang[0]
      for (var _lang in transLanguage) {
        if (matchLang.match(transLanguage[_lang])) {
          matchLang = _lang
          break
        }
      }
    } else {
      matchLang = defaultLang
    }

    Renderer.config.language = matchLang
    next()
  })

  // 首页重定向
  app.get('/', function (req, res, next) {
    var realPath = Renderer.config.viewsHome + '/' + Renderer.config.indexView + '.hbs'
    if (!fs.existsSync(realPath)) {
      res.status(404)
      res.send(notFoundResult())
    } else {
      var result = rendererResult(Renderer.config.indexView, req.query)
      res.send(result)
    }
  })

  /* 请求路径中没有.的情况:
      页面请求: urlData 为空, 根据路径找到 hbs后, 渲染页面
        组件绑定的服务, 都是在 inject helper 时被调用. 即在渲染的过程中实现
      ajax请求: urlData 不为空, 找不到 hbs 抛出异常, 进入 next(), 直接返回 urlData
  */
  app.get(/^([^\\.]+)$/, function (req, res, next) {
    var path = req.params[0]

    /* 非页面渲染的get请求也会执行url中的function，由此直接将非页面渲染的get请求跳转，
        也不需要后面的异常捕捉了，
        即对换原来的判断顺序 */
    var realPath = Renderer.config.viewsHome + path + '.hbs'
    if (!fs.existsSync(realPath)) {
      /* 检验是否有md页面可返回 */
      var mdPath = Renderer.config.viewsHome + path + '.md'
      if (!fs.existsSync(mdPath)) {
        /* api/404 */
        next()
      } else {
        /* 渲染md返回 */
        fs.readFile(mdPath, function (err, data) {
          if (err) throw err

          const mdHTML = md.render(data.toString())
          res.send(mdHTML)
        })
      }
    } else {
      /* 渲染hbs返回 */
      var result = rendererResult(path, req.query)
      res.send(result)
    }
  })

  // 请求路径中有.的情况: 发送路径下的文件
  app.get(/^(.+)$/, function (req, res, next) {
    var path = req.params[0]
    if (Renderer.config.assetsPrefix !== void 0 && path.startsWith(Renderer.config.assetsPrefix)) {
      path = path.substring(Renderer.config.assetsPrefix.length)
    }
    var realPath = '' + Renderer.config.filesHome + path
    if (fs.existsSync(realPath)) {
      res.sendFile(realPath)
    } else {
      next()
    }
  })

  // 请求路径中有.的情况
  app.all(/^(.+)$/, function (req, res) {
    var path = req.params[0]
    var dataResult = dataProvider.getUrlData(path, req.method, _.assign(req.query, req.body))
    if (dataResult.found) {
      res.send(dataResult.result)
    } else {
      res.status(404)
      res.send(notFoundResult())
    }
  })

  app.listen(Renderer.config.port)
}

function notFoundResult () {
  var realPath = Renderer.config.viewsHome + '/' + Renderer.config.errorView + '.hbs'
  if (fs.existsSync(realPath)) {
    return rendererResult(Renderer.config.errorView)
  } else {
    return '<h1>Page Not Found:404</h1>'
  }
}

function rendererResult (path, query) {
  var urlData = dataProvider.getUrlData(path, query)
  var globalData = dataProvider.getGlobalData()
  var context = _.isPlainObject(urlData.result) ? _.assign(query, urlData.result) : query
  context = _.assign(context, globalData)
  return render.renderFile(path, context)
}

function enviroment () {
  var configFile, basePath

  /* 获取工程绝对路径 */
  if (Renderer.config.configFilePath) {
    /* 已经指定配置文件路径，从文件读取配置，并以文件所在文件夹为基础工程路径 */
    configFile = path.resolve(process.cwd(), Renderer.config.configFilePath)
    if (fs.existsSync(configFile)) {
      var outerConfig = require(configFile)
      _.assign(Renderer.config, outerConfig)
      delete Renderer.config.env
      var _ref = outerConfig.env
      var envConfig = (_ref != null ? _ref[env] : void 0)
      if (envConfig) {
        _.assign(Renderer.config, envConfig)
      }
    }
    basePath = path.dirname(configFile)
  } else {
    configFile = process.cwd()
    basePath = configFile
  }

  /* 根据工程绝对路径，获取各资源（views、components、resources、data、helper）的绝对路径 */
  Renderer.config.filesHome = path.resolve(basePath, Renderer.config.filesHome)

  if (Renderer.config.viewsHome) {
    Renderer.config.viewsHome = path.resolve(basePath, Renderer.config.viewsHome)
  } else {
    Renderer.config.viewsHome = path.resolve(basePath, Renderer.config.filesHome, 'views')
  }

  if (Renderer.config.componentsHome) {
    Renderer.config.componentsHome = path.resolve(basePath, Renderer.config.componentsHome)
  } else {
    Renderer.config.componentsHome = path.resolve(basePath, Renderer.config.filesHome, 'components')
  }

  if (Renderer.config.resourcesHome) {
    Renderer.config.resourcesHome = path.resolve(basePath, Renderer.config.resourcesHome)
  } else {
    Renderer.config.resourcesHome = path.resolve(basePath, Renderer.config.filesHome, 'resources')
  }

  if (Renderer.config.testHome) {
    Renderer.config.testHome = path.resolve(basePath, Renderer.config.testHome)
  } else {
    Renderer.config.testHome = path.resolve(basePath, 'test')
  }

  Renderer.config.extraHelpers = _.map(Renderer.config.extraHelpers, function (helperFile) {
    return path.resolve(basePath, helperFile)
  })
}

module.exports = Renderer
