
const http = require('http');
const appConfig = require('../../server/config');
const baseHref = `http://localhost:{appConfig.port}/`;
function request(param) {
  if (typeof param === 'string') {
    param = {
      path: param
    };
  }

  param = Object.assign({
    hostname: 'localhost',
    port: appConfig.port,
    path: '/proxy/'
  }, param);

  param.url = baseHref + param.url;

  return new Promise((rs, rj) => {
    http.request(param, (res) => {
      rs(res);
    }, (err) => {
      rj(err);
    });
  })
}

module.exports = request;
