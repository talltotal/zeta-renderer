# zeta-renderer@0.0.9

## 安装

```
$ npm install -g zeta-renderer
```

## 使用

在编译后的工程根目录下执行:
```
$ renderer -p 8083 my_config.json
```

在package.json的*dependencies*中增加*"zeta-renderer": "latest"*
```
var renderer = require("zeta-renderer");

renderer({port:8083, configFilePath:"my_config.json"});
renderer.config; //返回配置
```
其中的选项:
1. port: 端口号 8080;
2. filesHome: 编译后的文件夹名 "public";
3. dataFiles: 数据文件路径 [];
4. extraHelpers: 自定义help文件路径 [];
5. assetsPrefix: filesHome目录下的文件路径 void 0;
6. user: 用户数据，用于注入_USER_ void 0;
7. configFilePath: 根目录下配置文件 "renderer.json";
8. indexView: 默认的页面view "index".

## 配置内容优先级
默认配置 < 调用参数/命令行 < 配置文件
