# @spore-ui/swbox

service-worker 封装方案，便捷管理缓存

`@spore-ui/swbox`

## 特性

- 使用 service worker 进行缓存文件
- 支持定制化缓存内容

## 使用

在页面引入文件即可直接使用

```html
<script src="swbox.min.js"></script>
```

```js
const sw = window.swbox.default;

// 判断浏览器是否支持该组件的特性。
sw.support();

// 设置sw配置项
sw.setConfig({
  // service worker 文件的注册地址
  registerUrl: '',
});

// add: 新增需要缓存的内容，version接受两种参数
// sw 生效时，将访问并缓存 file1?version=1.0.1
sw.add({
  url: 'file1',
  version: '1.0.1',
});

// 异步取得 version
sw.add({
  url: 'file2',
  version() {
    return Promise.resolve('1.1.1');
  },
});

// sw生效时，将一个文件代理为另一个文件来访问
sw.add({
  url: 'https://domain/path/file1',
  proxy: 'https://domain/path/file2',
});

// 变更版本文件访问方式
sw.add({
  url: 'path/file.js',
  proxy() {
    return 'path/1.1.1/file.js';
  },
});

// 版本路径可异步取得
sw.add({
  url: 'path/file.js',
  proxy() {
    return Promise.resolve('path/1.1.1/file.js');
  },
});

// start: 开启缓存功能
sw.start();

// clear: 清除service缓存
sw.clear();

```
