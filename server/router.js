const express = require('express');
const router = express.Router();
const mockData = {
  user: {
    name: 'lzw',
    email: 'l@lzw.me',
    tel: '13800000000'
  }
}
// 代理
router.get('/proxy/**', function(req, res, next) {
  console.log(req._parsedUrl.pathname);
  const pathname = req._parsedUrl.pathname;
  let msg = {code: 200};

  if (pathname.includes('/user')) {
    msg = Object.assign(msg, mockData.user);
  }

  res.send(msg);
});

module.exports = router;
