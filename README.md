# zeta-renderer@0.0.8

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
6. configFilePath: 根目录下配置文件 "renderer.json".
> configFilePath下文件的配置内容将覆盖其他配置。