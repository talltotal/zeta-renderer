var _ = require("lodash");
var fs = require("fs");
var path = require("path");
var commander = require("commander");

var config = {
  serverPort: 8080,
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
var configFilePath = "renderer.json";
var port = 8080;

// 非测试环境可指定配置文件、端口号
if (env !== "test") {
  commander.version("renderer version: 0.0.1").usage("[options] [file], file default: renderer.json").option("-p, --port [port]", "Use the specified port, will override port config in config.json.");
  commander.on("--help", function() {
    console.log("  Examples:");
    console.log("");
    console.log("    $ renderer");
    console.log("    $ renderer config.json");
    console.log("    $ renderer -p 8000");
  });
  commander.parse(process.argv);
  if (!_.isEmpty(commander.args)) {
    configFilePath = commander.args[0];
  }
  if (commander.port !== void 0) {
    port = parseInt(commander.port);
    if (_.isNaN(port)) {
      commander.help();
    }
  }
}

var configFile = path.resolve(process.cwd(), configFilePath);
var basePath = path.dirname(configFile);

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

if (commander.port !== void 0) {
  port = parseInt(commander.port);
  if (_.isNaN(port)) {
    commander.help();
  }
  config.serverPort = port;
}

console.log("Config file path: " + configFile);

console.log("Config loaded:");

console.log(config);

module.exports = config;
