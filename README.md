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

## helper

1. `ifCond` 
2. `size` 返回数组的大小
3. `json` 将对象以`json`格式返回
4. `mod` 是否整除
5. `neither` 两个非
6. `and` 两个是
7. `gt` 大于
8. `equals` 相等
9. `add` 两个数字相加
10. `of` 参数一在数组二中
11. `formatDate` 将`long`格式的时间以`YYYY-MM-DD HH:mm:ss`格式返回
12. `formatPrice` 将分为单位的金额以`xx.xx`格式返回
13. `assign` 在上下文定义一个变量
14. `markdown` 引入.md文件
15. `inject` 引入.hbs文件