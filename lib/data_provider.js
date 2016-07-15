var _ = require("lodash");
var fs = require("fs");
var path = require("path");

var fileWatcher = require("./file_watcher");
var env = require("./enviroments");

var dataFilePaths = env.dataFiles;
var urlData = {};
var compData = {};
var globalData = {};

// 将数据中url、comp、global分别保存在对象中
var loadData = function(dataFilePath) {
  if (fs.existsSync(dataFilePath)) {
    var data = require(dataFilePath);
    urlData = _.assign(urlData, data.urls);
    compData = _.assign(compData, data.comps);
    globalData = _.assign(globalData, data.globals);
  }
};

_.each(dataFilePaths, loadData);

// 监听文件夹变化,发生变化时重新读取数据
fileWatcher.watchFiles(dataFilePaths, function(dataFilePath) {
  require.cache[dataFilePath] = null;
  try {
    loadData(dataFilePath);
    console.log("[Data Reload] " + dataFilePath);
  } catch (_error) {
    var err = _error;
    console.log("[Data Reload Error] " + dataFilePath + " - " + err);
  }
});

module.exports = {
  getUrlData: function(path, method, params) {
    if (!_.has(urlData, path)) {
      return {
        found: false
      };
    }
    var data = urlData[path];
    return {
      found: true,
      result: _.isFunction(data) ? data(params, method) : data
    };
  },
  getCompData: function(path, params) {
    if (!_.has(compData, path)) {
      return {
        found: false
      };
    }
    var data = compData[path];
    return {
      found: true,
      result: _.isFunction(data) ? data(params) : data
    };
  },
  getGlobalData: function() {
    return globalData;
  }
};

