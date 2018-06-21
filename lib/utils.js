const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const cwd = process.cwd();
const config = require('./config');

module.exports = {
  chalk,
  // 配置信息
  config,
  // 取得mock文件的路径
  getDataFilePath(pathname, dataFolder) {
    if (dataFolder === 'autosave') {
      dataFolder = config.autoSavePath;
    } else if (dataFolder === 'customdata') {
      dataFolder = config.customDataPath;
    } else {
      dataFolder = config.mockDataPath;
    }

    if (pathname) {
      pathname = pathname.replace(/\//g, '_').slice(1) + '.js';
    } else {
      pathname = '';
    }

    return path.resolve(dataFolder, pathname);
  },
  // 判断指定到文件是否存在
  isExists(filePath) {
    return fs.existsSync(filePath);
  }
};
