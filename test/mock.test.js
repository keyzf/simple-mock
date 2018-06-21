const path = require('path');
const expect = require("chai").expect;
const utils = require('../lib/utils');
const request = require('./helper/request.js');
const startServe = require('../server/www-test');
function closeServer(server) {
  return new Promise((rs, rj) => {
    setTimeout(() => {
      server.close(() => {
        console.log('server closed!');
        rs();
      }, rj);
    }, 50)
  });
}

describe('utils.js', () => {
  let config;
  let server;

  // beforeEach(async function() {
  //   if (server && server.close) {
  //     await closeServer(server);
  //   }
  // });

  describe('#find()', function() {
    it('responds with matching records', async function(done) {
      // 开启MOCK功能
      process.env.MOCKAPI_ENABLE='mock';
      // 开启自动保存API返回内容
      process.env.MOCKAPI_AUTOSAVE='save';
      // 强制每次请求都保存API返回内容(未开启MOCK功能时有效，一般不推荐开启)
      process.env.MOCKAPI_AUTOSAVE_FORCE='force';

      let server = startServe();
      const res = await request('/user');
      console.log(res);
      await closeServer(server);
      expect(res.code).eq(200);
      done();
    });
  });
});
