require("./polyfill");

var _ = require("lodash");
var fs = require("fs");
var path = require("path");
var express = require("express");
var bodyParser = require('body-parser');

// 初始化配置
// 初始化渲染环境
var render = require("./handlebars/render");
var dataProvider = require("./data_provider");
var FileNotFoundError = require("./errors");

Renderer.config = {
  port: 8080,
  filesHome: "public",
  viewsHome: void 0,
  componentsHome: void 0,
  dataFiles: [],
  extraHelpers: [],
  oldMode: false,
  pageMode: false,
  assetsPrefix: void 0
};
var env = process.env.NODE_ENV || "dev";

function Renderer(options){

  var app = express();
  
  _.assign(Renderer.config, options);
  
  enviroment();

  dataProvider(Renderer.config.dataFiles);
  render(Renderer.config);

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  /* 请求路径中没有.的情况: 
      页面请求: urlData 为空, 根据路径找到 hbs后, 渲染页面
        组件绑定的服务, 都是在 inject helper 时被调用. 即在渲染的过程中实现
      ajax请求: urlData 不为空, 找不到 hbs 抛出异常, 进入 next(), 直接返回 urlData
  */
  app.get(/^([^\.]+)$/, function(req, res, next) {
    var path = req.params[0];

    /* 非页面渲染的get请求也会执行url中的function，由此直接将非页面渲染的get请求跳转，
        也不需要后面的异常捕捉了，
        即对换原来的判断顺序 */
    var realPath = Renderer.config.viewsHome + path + ".hbs";
    if (!fs.existsSync(realPath)) {
      next();
      return;
    }

    var urlData = dataProvider.getUrlData(path, req.query);
    var globalData = dataProvider.getGlobalData();
    var context = _.isPlainObject(urlData.result) ? _.assign(req.query, urlData.result) : req.query;
    context = _.assign(globalData, context);
    /*try {*/
    var result = render.renderFile(path, context);
    res.send(result);
    /*} catch (_error) {
      var err = _error;
      if (err instanceof FileNotFoundError) {
        next();
      } else {
        throw err;
      }
    }*/
  });

  // 请求路径中有.的情况: 发送路径下的文件
  app.get(/^(.+)$/, function(req, res, next) {
    var path = req.params[0];
    if (Renderer.config.assetsPrefix !== void 0 && path.startsWith(Renderer.config.assetsPrefix)) {
      path = path.substring(Renderer.config.assetsPrefix.length);
    }
    var realPath = "" + Renderer.config.filesHome + path;
    if (fs.existsSync(realPath)) {
      res.sendFile(realPath);
    } else {
      next();
    }
  });

  // 请求路径中有.的情况
  app.all(/^(.+)$/, function(req, res) {
    var path = req.params[0];
    var dataResult = dataProvider.getUrlData(path, req.method, _.assign(req.query, req.body));
    if (dataResult.found) {
      res.send(dataResult.result);
    } else {
      res.status(404);
      res.send();
    }
  });

  app.listen(Renderer.config.port);
}

function enviroment(){
  var configFile, basePath;

  if (Renderer.config.configFilePath) {
    configFile = path.resolve(process.cwd(), Renderer.config.configFilePath);
    if (fs.existsSync(configFile)) {
      var outerConfig = require(configFile);
      _.assign(Renderer.config, outerConfig);
      delete Renderer.config.env;
      var _ref = outerConfig.env;
      var envConfig;
      if (envConfig = (_ref != null ? _ref[env] : void 0)) {
        _.assign(Renderer.config, envConfig);
      }
    }
    basePath = path.dirname(configFile);
  } else {
    configFile = process.cwd();
    basePath = configFile;
  }

  // 将相对路径都 resolve 为绝对路径(相对于 process.cwd())
  Renderer.config.filesHome = path.resolve(basePath, Renderer.config.filesHome);

  if (Renderer.config.viewsHome) {
    Renderer.config.viewsHome = path.resolve(basePath, Renderer.config.viewsHome);
  } else {
    Renderer.config.viewsHome = path.resolve(basePath, Renderer.config.filesHome, "views");
  }

  if (Renderer.config.componentsHome) {
    Renderer.config.componentsHome = path.resolve(basePath, Renderer.config.componentsHome);
  } else {
    Renderer.config.componentsHome = path.resolve(basePath, Renderer.config.filesHome, "components");
  }

  Renderer.config.dataFiles = _.map(Renderer.config.dataFiles, function(dataFile) {
    return path.resolve(basePath, dataFile);
  });

  Renderer.config.extraHelpers = _.map(Renderer.config.extraHelpers, function(helperFile) {
    return path.resolve(basePath, helperFile);
  });
}

module.exports = Renderer;