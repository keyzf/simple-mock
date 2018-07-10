const zlib = require('zlib');
const concatStream = require('concat-stream');

const utils = require('./utils');
const config = utils.config;

const fs = require('fs');
const path = require('path');

/**
 * Modify the response of json
 * @param res {Response} The http response
 * @param contentEncoding {String} The http header content-encoding: gzip/deflate
 * @param callback {Function} Custom modified logic
 */
function modifyResponse(res, contentEncoding, callback) {
  let unzip, zip;

  // const contentEncoding = req.headers['content-encoding'];

  // Now only deal with the gzip and deflate content-encoding.
  if (contentEncoding === 'gzip') {
    unzip = zlib.Gunzip();
    zip = zlib.Gzip();
  } else if (contentEncoding === 'deflate') {
    unzip = zlib.Inflate();
    zip = zlib.Deflate();
  }

  // The cache response method can be called after the modification.
  const _write = res.write;
  const _end = res.end;

  if (unzip) {
    unzip.on('error', function(e) {
      console.log('Unzip error: ', e);
      _end.call(res);
    });
  } else {
    console.log('Not supported content-encoding: ' + contentEncoding);
    return;
  }

  // The rewrite response method is replaced by unzip stream.
  res.write = function(data) {
    unzip.write(data);
  };

  res.end = function(data) {
    unzip.end(data);
  };

  // Concat the unzip stream.
  var concatWrite = concatStream(function(data) {
    var body;
    try {
      body = JSON.parse(data.toString());
    } catch (e) {
      body = data.toString();
      console.log('JSON.parse error:', e);
    }

    // Custom modified logic
    if (typeof callback === 'function') {
      body = callback(body, res);
    }

    // Converts the JSON to buffer.
    body = new Buffer(JSON.stringify(body));

    // Call the response method and recover the content-encoding.
    zip.on('data', function(chunk) {
      _write.call(res, chunk);
    });
    zip.on('end', function() {
      _end.call(res);
    });

    zip.write(body);
    zip.end();
  });
  unzip.pipe(concatWrite);
}

// 保存 API 请求返回的内容到 customdata 目录
module.exports = function saveApi(req, res, contentEncoding) {
  if (!config.isAutoSaveApi) {
    return;
  }

  const absolutePath = utils.getDataFilePath(
    req._parsedUrl.pathname,
    'autosave'
  );

  // 已经存在
  if (utils.isExists(absolutePath)) {
    // 未开启强制保存，或者开启了 mock，则不保存
    if (!config.isForceSaveApi || config.isEnableMock) {
      return;
    }
  }

  modifyResponse(res, contentEncoding, function(content) {
    console.log(utils.chalk.yellow('[saveApi]'), absolutePath);
    fs.writeFile(
      absolutePath,
      `module.exports = ${JSON.stringify(content, true, 2)}`,
    (err) => {
      if (err) {
        console.log(utils.chalk.red.bold('尝试写入文件失败!'), utils.chalk.yellow(absolutePath));
        console.log(err);
      }
    });

    return content;
  });
};
