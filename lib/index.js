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

var config = {
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
  
  _.assign(config, options);
  
  enviroment();

  dataProvider(config.dataFiles);
  render(config);

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  /* 请求路径中没有.的情况: 
      页面请求: urlData 为空, 根据路径找到 hbs后, 渲染页面
        组件绑定的服务, 都是在 inject helper 时被调用. 即在渲染的过程中实现
      ajax请求: urlData 不为空, 找不到 hbs 抛出异常, 进入 next(), 直接返回 urlData
  */
  app.get(/^([^\.]+)$/, function(req, res, next) {
    var path = req.params[0];
    var urlData = dataProvider.getUrlData(path, req.query);
    var globalData = dataProvider.getGlobalData();
    var context = _.isPlainObject(urlData.result) ? _.assign(req.query, urlData.result) : req.query;
    context = _.assign(globalData, context);
    try {
      var result = render.renderFile(path, context);
      res.send(result);
    } catch (_error) {
      var err = _error;
      if (err instanceof FileNotFoundError) {
        next();
      } else {
        throw err;
      }
    }
  });

  // 请求路径中有.的情况: 发送路径下的文件
  app.get(/^(.+)$/, function(req, res, next) {
    var path = req.params[0];
    if (config.assetsPrefix !== void 0 && path.startsWith(config.assetsPrefix)) {
      path = path.substring(config.assetsPrefix.length);
    }
    var realPath = "" + config.filesHome + path;
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
      console.log("[Not Found] " + path);
      res.status(404);
      res.send();
    }
  });

  app.listen(config.port);

  console.log("server listening at port: " + config.port);
}

function enviroment(){
  var configFile, basePath;

  if (config.configFilePath) {
    configFile = path.resolve(process.cwd(), config.configFilePath);
    if (fs.existsSync(configFile)) {
      var outerConfig = require(configFile);
      _.assign(config, outerConfig);
      delete config.env;
      var _ref = outerConfig.env;
      var envConfig;
      if (envConfig = (_ref != null ? _ref[env] : void 0)) {
        _.assign(config, envConfig);
      }
    }
    basePath = path.dirname(configFile);
  } else {
    configFile = process.cwd();
    basePath = configFile;
  }

  // 将相对路径都 resolve 为绝对路径(相对于 process.cwd())
  config.filesHome = path.resolve(basePath, config.filesHome);

  if (config.viewsHome) {
    config.viewsHome = path.resolve(basePath, config.viewsHome);
  } else {
    config.viewsHome = path.resolve(basePath, config.filesHome, "views");
  }

  if (config.componentsHome) {
    config.componentsHome = path.resolve(basePath, config.componentsHome);
  } else {
    config.componentsHome = path.resolve(basePath, config.filesHome, "components");
  }

  config.dataFiles = _.map(config.dataFiles, function(dataFile) {
    return path.resolve(basePath, dataFile);
  });

  config.extraHelpers = _.map(config.extraHelpers, function(helperFile) {
    return path.resolve(basePath, helperFile);
  });

  console.log("Config file path: " + configFile);

  console.log("Config loaded:");

  console.log(config);
}

module.exports = Renderer;