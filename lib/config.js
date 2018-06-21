const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const utilDir = require('./utils-dir');
const cwd = process.cwd();

let config;
const cfgFile = path.resolve(cwd, 'simple-mock-config.js');

try {
  config = require(cfgFile);
} catch (err) {
  console.log(
    chalk.yellow('[warning] Not find config file of simple-mock-config.js: '),
    cfgFile
  );
  config = {};
}

// 环境变量中的配置优先
const envCfg = {
  // 是否开启 Mock API 功能
  isEnableMock:
    (process.env.NODE_ENV === 'dev' ||
      process.env.NODE_ENV === 'development') &&
    ('' + process.env.MOCKAPI_ENABLE).trim() === 'mock',
  // 是否自动保存远端请求的 API
  isAutoSaveApi: ('' + process.env.MOCKAPI_AUTOSAVE).trim() === 'save',
  // 是否强制保存，否则本地有时不再保存。isEnableMock 为 false 时有效
  isForceSaveApi: ('' + process.env.MOCKAPI_AUTOSAVE_FORCE).trim() === 'force'
};

for (const key in envCfg) {
  if (envCfg[key]) {
    config[key] = true;
  }
}

const baseDataPath = path.resolve(cwd, config.mockFileDir || 'mock');
const mockDataPath = path.resolve(baseDataPath, 'mockdata');
const customDataPath = path.resolve(baseDataPath, 'customdata');
const autoSavePath = path.resolve(customDataPath, 'autosave');

// 创建目录
if (!fs.existsSync(mockDataPath) || !fs.statSync(mockDataPath).isDirectory()) {
  utilDir.mkDir(mockDataPath);
}

if (
  !fs.existsSync(customDataPath) ||
  !fs.statSync(customDataPath).isDirectory()
) {
  utilDir.mkDir(customDataPath);
}

if (!fs.existsSync(autoSavePath) || !fs.statSync(autoSavePath).isDirectory()) {
  utilDir.mkDir(autoSavePath);
}

// config.mockFileDir 目录下应存在 .gitignore 文件
const gitignoreFile = path.resolve(baseDataPath, '.gitignore');

if (!fs.existsSync(gitignoreFile)) {
  fs.writeFile(gitignoreFile, 'customdata/**', { encoding: 'utf8' });
}

// 导出配置
module.exports = Object.assign(config, {
  baseDataPath,
  mockDataPath,
  customDataPath,
  autoSavePath
});
