var _ = require('lodash')
var fs = require('fs')
var path = require('path')
var express = require('express')
var bodyParser = require('body-parser')
var yaml = require('js-yaml')

var md = require('./markdown')
var render = require('./handlebars/render')
var dataProvider = require('./data_provider')

/**
 * 所有的配置项
 */
Renderer.config = {
  /**
   * 服务默认端口号
   */
  port: 8080,
  /**
   * 配置文件
   * 配置文件所在目录视为基础路径
   * 在配置文件中可定义多种环境，指定一个环境，为当前效果
   */
  configFilePath: void 0,
  /**
   * html文件名，用来编辑js
   */
  indexView: 'index',
  /**
   * 错误页面，无页面匹配的时候显示
   */
  errorView: 'error',
  /**
   * 交付件所在文件夹路径
   * 相对于执行命令所在路径
   */
  filesHome: 'public',
  /**
   * 交付件中hbs页面文件所在文件夹路径
   * 相对于filesHome
   */
  viewsHome: 'views',
  /**
   * 交付件中component组件文件所在文件夹路径
   * 相对于filesHome
   */
  componentsHome: 'components',
  resourcesHome: 'resources',
  testHome: 'test',
  dataFiles: [],
  extraHelpers: [],
  oldMode: false,
  pageMode: false,
  assetsPrefix: void 0,
  user: void 0
}
/**
 * 执行模式
 * ['dev','test']
 */
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

  /* 请求路径中没有.的get请求:
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

  // 所有get请求: 发送路径下的文件
  app.get(/^(.+)$/, function (req, res, next) {
    var path = req.params[0]
    if (Renderer.config.assetsPrefix !== void 0 && _.startsWith(path, Renderer.config.assetsPrefix)) {
      path = path.substring(Renderer.config.assetsPrefix.length)
    }
    var realPath = '' + Renderer.config.filesHome + path
    if (fs.existsSync(realPath)) {
      res.sendFile(realPath)
    } else {
      next()
    }
  })

  // 所有请求
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

/**
 * 当找不到页面时
 */
function notFoundResult () {
  var realPath = Renderer.config.viewsHome + '/' + Renderer.config.errorView + '.hbs'
  if (fs.existsSync(realPath)) {
    return rendererResult(Renderer.config.errorView)
  } else {
    return '<h1>Page Not Found:404</h1>'
  }
}

/**
 * 页面渲染
 * @param {String} path 
 * @param {Object} query 
 */
function rendererResult (path, query) {
  var urlData = dataProvider.getUrlData(path, query)
  var globalData = dataProvider.getGlobalData()
  var context = _.isPlainObject(urlData.result) ? _.assign(query, urlData.result) : query
  context = _.assign(context, globalData)
  return render.renderFile(path, context)
}

/**
 * 解析环境配置
 */
function enviroment () {
  var basePath = process.cwd()

  /* 获取工程绝对路径 */
  if (Renderer.config.configFilePath) {
    /* 已经指定配置文件路径，从文件读取配置，并以文件所在文件夹为基础工程路径 */
    const configFile = path.resolve(basePath, Renderer.config.configFilePath)
    if (fs.existsSync(configFile)) {
      var outerConfig = require(configFile)
      _.assign(Renderer.config, outerConfig)
      /** 使用指定环境的配置覆盖基础配置 */
      delete Renderer.config.env
      var _ref = outerConfig.env
      var envConfig = (_ref != null ? _ref[env] : void 0)
      if (envConfig) {
        _.assign(Renderer.config, envConfig)
      }
    }
    basePath = path.dirname(configFile)
  }

  /* 根据工程绝对路径，获取各资源（views、components、resources、data、helper）的绝对路径 */
  const filesHome = path.resolve(basePath, Renderer.config.filesHome)
  Renderer.config.filesHome = filesHome

  /** 工程目录resolve */
  Renderer.config.viewsHome = path.resolve(filesHome, Renderer.config.viewsHome)
  Renderer.config.componentsHome = path.resolve(filesHome, Renderer.config.componentsHome)
  Renderer.config.resourcesHome = path.resolve(filesHome, Renderer.config.resourcesHome)

  /** 后端渲染用目录resolve */
  Renderer.config.testHome = path.resolve(basePath, Renderer.config.testHome)
  Renderer.config.extraHelpers = _.map(Renderer.config.extraHelpers, function (helperFile) {
    return path.resolve(basePath, helperFile)
  })
}

module.exports = Renderer
