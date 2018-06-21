
# SIMPLE-MOCK

以注入到 `node server` 的 API 代理方式，实现简洁的 API MOCK 功能。

## mock API 的作用

- 前后端新功能开发完全分离：API 未出来但规则已约定好，前端可提前开发和测试
- 不受后端问题牵制：API 不可用时替代，不阻塞前端开发
- 开发体验提升：API 请求多、慢，MOCK 情况下，开发调试体验更好
- mock规则辅助：提供了自动保存后端 API 请求内容的辅助功能，编写 mock 内容规则不再麻烦
- more...

## 安装与使用

```bash
yarn add -d simplemock
```

**使用：**

在 nodejs 服务中的 API 代理部分，加入 `saveApi` 相关逻辑。示例参考：


**使用示例：**

这里以 `http-proxy` 作为代理示例，具体参见 `server/app.js` 中的源码。

```js
const app = require('express')();
const bodyParser = require('body-parser');
const httpProxy = require('http-proxy');
const apiProxy = httpProxy.createProxyServer();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

/**
 * 接口代理配置与mock
 */
const apiMock = require('simplemock');

app.all('/{api,rest}/**', function(req, res) {
  // 开发模式下且可 mock 的情况
  if (appConfig.media === 'dev' && apiMock.render(req, res)) {
    return;
  }

  console.log('[apiProxy]', req._parsedUrl.pathname);
  apiProxy.web(req, res, {target: config[proxyTarget]});
});

// 在代理返回时，注入 saveApi 方法
apiProxy.on('proxyRes', function (proxyRes, req, res) {
  apiMock.saveApi(req, res, proxyRes.headers['content-encoding']);
});

// 以下为针对 post 请求，代理消费了 stream 的情况
// 针对 post 请求，将 (express.js)bodyParser 消费过的 stream 重新写回到 req
const queryString = require('querystring');
apiProxy.on('proxyReq', function(proxyReq, req, res, options) {
  if (!req.body || !Object.keys(req.body).length) {
    return;
  }

  const contentType = proxyReq.getHeader('Content-Type');
  let bodyData;

  if (contentType === 'application/json') {
    bodyData = JSON.stringify(req.body);
  }

  if (contentType === 'application/x-www-form-urlencoded') {
    bodyData = queryString.stringify(req.body);
  }

  if (bodyData) {
    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
    proxyReq.write(bodyData);
  }
});
```

## mock 规则

简单 mock 的规则为：

- 请求 URL 路径中将 / 替换为 _ 作为文件名，以 js 结尾。例如，请求 URL 为 `/a/b/c`，则对应的文件名应当为 `a_b_c.js`
- 关于规则文件：
  - 导出内容可为普通对象或数组、字符等，将直接作为 API 返回内容
  - 导出内容可为函数，函数传入参数 req 和 req 对象。此时：
    - 可根据 req.query 处理不同的返回内容；
    - 可直接处理返回信息。如： `res.status(200).send(content)`，`res.status(403).send('禁止访问')`(模拟出错)
- `mockdata` 目录为常用的公共 API，会提交至 GIT 仓库
- `customdata` 目录为本地自定义 API，不会提交至 GIT 仓库。并且该目录内容优先级大于 `mockdata` 目录
- 不 mock 的情况(代理至后端 API)：
  - 符合规则的文件不存在
  - 文件导出内容为 `undefined`、`null` 或者  `__ignore_mock__`

mock 文件查找规则：

- 先查找 `${config.mockFileDir}/customdata` 目录
- 再查找 `${config.mockFileDir}/mockdata` 目录
- 最后查找 `${config.mockFileDir}/customdata/autosave` 目录
- 都没有，则走转发到真实 API 代理。如果开启了自动保存，则会将返回结果保存到 `autosave` 目录中

## 开启 mock 开发方式

- 开启MOCK功能 `process.env.MOCKAPI_ENABLE=mock`
- 开启自动保存API返回内容 `process.env.MOCKAPI_AUTOSAVE=save`
- 强制每次请求都保存API返回内容(未开启MOCK功能时有效，一般不推荐开启) `process.env.MOCKAPI_AUTOSAVE_FORCE=force`

示例，开启 mock 功能，开启自动保存 API 至自定义目录：

```bash
set MOCKAPI_ENABLE=mock
set MOCKAPI_AUTOSAVE=save
npm run dev
```

## 配置与 API

### 配置

- 环境变量方式：

环境变量重要用于开启或关闭相关功能。其开启功能的优先级高于 `simple-mock-config.js` 中的配置。

```bash
// 开启MOCK功能
process.env.MOCKAPI_ENABLE=mock
// 开启自动保存API返回内容
process.env.MOCKAPI_AUTOSAVE=save
// 强制每次请求都保存API返回内容(未开启MOCK功能时有效，一般不推荐开启)
process.env.MOCKAPI_AUTOSAVE_FORCE=force
```

- 配置文件方式：

项目根目录 `simple-mock-config.js` 为配置文件，应自行创建，并配置 `.gitignore` 中忽略它，以便于随时修改 mock 行为。主要示例配置参考：
```js
module.exports = {
  mockFileDir: 'mock', // path.reslove(process。cwd(), 'mock'), // 指定 mock 文件存放的目录
  isEnableMock: false, // 是否开启 Mock API 功能
  isAutoSaveApi: true, // 是否自动保存远端请求的 API
  isForceSaveApi: false, // 是否强制保存，否则本地有时不再保存
}
```

### API

- `render(req, res, apiPath)`

判断一个请求是否可 mock，如果满足条件则执行 mock 逻辑。
应在 nodejs 服务中，插入代理转发前，返回为 `true` 则表示可 mock，否则为不 mock，应继续走代理转发逻辑。

- `saveApi(req, res, contentEncoding)`

用于请求返回时，是否保存返回的 API 信息。用于后端 API 代理转发信息返回时注入。

## FAQ

- 如何保存通过代理返回的信息？

关闭 mock 功能，开启自动保存API功能：

```bash
process.env.MOCKAPI_ENABLE=N
process.env.MOCKAPI_AUTOSAVE=save
```

- 在开启 mock 模式下，如何忽略某个 API 请求的 mock，从真实后端 API 去请求？

在 `mock/customdata`目录中，编辑该 API 对应的 mock 文件，将返回值改为 `__ignore_mock__`。如果需要根据参数来处理，也是可以实现的，示例：
```js
// 忽略mock
module.exports = '__ignore_mock__';
// or
module.exports = req => {
  const query = Object.assign({}, req.query, req.body);
  // id 为 1 则不 mock
  if (+query.id === 1) {
    return '__ignore_mock__';
  }

  return {...};
}

- `小技巧`：对于同一 API，如何快速保存不同参数返回的不同的值？

简单的数据返回，在 `customdata` 目录下自行写逻辑即可。但对于不同参数返回结果复杂，且差异巨大。这种情况下，自行写逻辑就变得繁琐。

此时可关闭mock，开启自动保存和强制保存：
```js

```
module.exports = {
  mockFileDir: 'mock',
  isEnableMock: false,
  isAutoSaveApi: true,
  isForceSaveApi: true,
}
```
然后每触发一次请求成功后，到`customdata/autosave` 中找到返回内容，复制出来，如此即可快速得到不同的返回值，再到`customdata` 中根据不同参数定义不同的返回逻辑。

- mock 模式下，API 对应 mock 文件不存在时，会转发至后端。但此时会报错？

登陆信息为 mock 返回，session 为无效信息，转发至后端登陆认证失败，API 请求自然也不会成功。
此时可关闭 mock 功能，正常登陆一次，再开启mock；也可临时关闭登陆相关 API 的 mock。

- 忽略自定义目录 customdata 的内容，使用公共目录下的 mockdata?

当 customdata 目录下有符合的规则时，会优先使用，否则则使用 mockdata 下的规则定义。因此，删除 customdata 目录下的定义即可。
但是因为开启 `saveApi` 会自动保存到 customdata，所以还有一种办法，就是在该目录下的文件中导出值为 `undefined`：

```js
module.exports = void(0);
```

- saveApi 保存的某 API 的内容陈旧怎么办？

手动修改对应 mock 数据规则符合你的需要，或者删除相关文件，以重新自动保存远端请求的结果。

- more...
