const path = require('path');
const fs = require('fs');
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const httpProxy = require('http-proxy');

const routes = require('./router');
const appConfig = require('./config');

const app = express();
const apiProxy = httpProxy.createProxyServer();
const isDev = app.get('env') === 'development' || app.get('env') === 'dev';
const proxyTarget = `http://localhost:${appConfig.port}/proxy/`;
console.log('current proxyTarget: ', proxyTarget);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

/**
 * 接口代理配置与mock
 */
const apiMock = require('../lib');

appConfig.API_PROXY_CONFIG.forEach(function(config, index) {
  (function(config){
    config.apiPaths.forEach(function(apiPath){
      app.all(apiPath, function(req, res){
        if (appConfig.media === 'dev' && apiMock.render(req, res)) {
          return;
        }

        console.log('[apiProxy]', req._parsedUrl.pathname);
        apiProxy.web(req, res, {target: proxyTarget});
      });
    });
  })(config);
});

apiProxy.on('proxyRes', function (proxyRes, req, res) {
  apiMock.saveApi(req, res, proxyRes.headers['content-encoding']);
});

const queryString = require('querystring');
apiProxy.on('proxyReq', function(proxyReq, req, res, options) {
  // 针对 post 请求，将 bodyParser 消费过的 stream 重新写回到 req
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

app.use(express.static(path.join(__dirname, '../mockdata/')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
// development error handler will print stacktrace
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: isDev ? err : {}
  });
});

module.exports = app;
