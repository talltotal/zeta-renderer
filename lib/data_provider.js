var _ = require("lodash");
var fs = require("fs");
var path = require("path");

var fileWatcher = require("./file_watcher");

var urlData = {};
var compData = {};
var globalData = {};

var loadData = function(dataFilePath) {
  if (fs.existsSync(dataFilePath)) {
    var data = require(dataFilePath);
    urlData = _.assign(urlData, data.urls);
    compData = _.assign(compData, data.comps);
    globalData = _.assign(globalData, data.globals);
  }
};

var DataProvider = function(dataFilePaths, testHome){

  var filePaths = fs.readdirSync(testHome);
  dataFilePaths = _.map(filePaths, function(dataFile) {
    return path.resolve(testHome, dataFile);
  });
  _.each(dataFilePaths, loadData);

  // 监听文件夹变化,发生变化时重新读取数据
  fileWatcher.watchFiles(testHome, function(dataFilePath) {
    require.cache[dataFilePath] = null;
    try {
      loadData(dataFilePath);
    } catch (_error) {
      var err = _error;
      console.log("[Data Reload Error] " + dataFilePath + " - " + err);
    }
  });
}

DataProvider.getUrlData = function(path, method, params) {
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
};

DataProvider.getCompData = function(path, params) {
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
};

DataProvider.getGlobalData = function() {
  return globalData;
};

// 将数据中url、comp、global分别保存在对象中

module.exports = DataProvider;

