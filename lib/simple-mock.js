const utils = require('./utils');

/**
 *
 * @param {string} type 取值为 autosave、customdata 或 mockdata
 */
function tryGetContent(req, type) {
  const absolutePath = utils.getDataFilePath(req._parsedUrl.pathname, type);

  if (!utils.isExists(absolutePath)) {
    return false;
  }

  try {
    content = require(absolutePath);

    if ([void 0, null].includes(content)) {
      return false;
    }

    return content;
  } catch (e) {
    console.log(
      utils.chalk.bold.red('[try mock error]: '),
      req._parsedUrl.pathname,
      content,
      e
    );
    return false;
  }
}

/**
 * 最普通的 mock 规则：读取 customdata 或 mockdata 目录下的文件，如符合则返回 mock 数据
 * @param {*} req
 * @param {*} res
 */
module.exports = function simpleMock(req, res) {
  // console.log('simplemock');
  // 自定义目录优先
  let absolutePath = utils.getDataFilePath(
    req._parsedUrl.pathname,
    'customdata'
  );
  let isCustomData;

  // 自定义目录有限
  let content = tryGetContent(req, 'customdata');

  // 自定义不存在，看公共定义
  if (!content) {
    content = tryGetContent(req, 'mockdata');
  }

  // 公共定义也没有，看看自动保存的内容
  if (!content) {
    content = tryGetContent(req, 'autosave');
  }

  if (!content) {
    console.log(utils.chalk.red('File not exists, ignore mock:'), absolutePath);
    return false;
  }

  // 支持返回为方法，传递 req 参数过去
  if (typeof content === 'function') {
    res.set('X-Powered-By', 'simplemock-custom');
    content = content(req, res);
  }

  // 在规则文件内已经在 content 方法中处理了，则返回 true
  if (res.headersSent) {
    console.log(utils.chalk.green('[mockAPI custom'), req.url, absolutePath);
    return true;
  }

  // 取消 mock 的情况
  if ([void 0, null, '__ignore_mock__'].includes(content)) {
    console.log(utils.chalk.blue('[Ignore mock]'), content);
    return false;
  }

  console.log(
    utils.chalk.green('[mockAPI]'),
    req.url,
    utils.chalk.yellow(absolutePath)
  );
  res.set('X-Powered-By', 'simplemock');
  res.status(200).json(content);
  res.end();

  return true;
};
