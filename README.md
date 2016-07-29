# zeta-renderer@0.0.7

## 安装

```
$ npm install -g zeta-renderer
```

## 使用

在编译后的工程根目录下执行:
```
$ renderer -p 8083 my_config.json
```

在package.json的*dependencies*中增加*"zeta-renderer": "0.0.7"*
```
var renderer = require("zeta-renderer");

renderer({port:8083, configFilePath:"my_config.json"});
```
其中的选项:
1. port:端口号;默认为8080
2. configFilePath:根目录下配置文件;默认为"renderer.json"

