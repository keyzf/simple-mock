const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const utilDir = require('./utils-dir');
const cwd = process.env.PROJECT_CWD || process.cwd();

/**
 * 从配置文件中读取 config 配置，如配置文件不存在，则创建它
 */
function getConfigFromFile() {
  // cwd 目录不存在配置文件，则写入它
  const cfgFile = path.resolve(cwd, 'simple-mock-config.js');
  const cfgExampleFile = path.resolve(__dirname, '../simple-mock-config-example.js');
  if (!fs.existsSync(cfgFile)) {
    console.log(chalk.yellow.bold('创建 simple-mock 配置文件 simple-mock-config.js'));
    fs.writeFileSync(cfgFile, fs.readFileSync(cfgExampleFile));

    // 将 simple-mock-config.js 加入 git 忽略
    const gitignoreFile = path.resolve(cwd, '.gitignore');
    if (fs.existsSync(gitignoreFile)) {
      const gitignoreContent = fs.readFileSync(gitignoreFile, 'utf8') + '';
      if (!gitignoreContent.includes('simple-mock-config.js')) {
        console.log(chalk.yellow.bold('将 simple-mock-config.js 写入到 .gitignore'));
        fs.appendFileSync(gitignoreFile, '\nsimple-mock-config.js', 'utf-8');
      }
    }
  }

  let config;
  try {
    config = require(cfgFile);
  } catch (err) {
    console.log(
      chalk.yellow('[warning] Not find config file of simple-mock-config.js: '),
      cfgFile
    );
    config = {};
  }

  return config;
}

/**
 * 从环境变量中读取 config 配置
 */
function getConfigFromEnv(config) {
  config = config || {};
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

  return config;
}

/**
 * 获取或创建各种mock 目录
 */
  function getOrCreateDirs(config) {
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

  Object.assign(config, {
    baseDataPath,
    mockDataPath,
    customDataPath,
    autoSavePath
  });

  return config;
}

function renderConfig() {
  let config = getConfigFromFile();
  config = getConfigFromEnv(config);
  config = getOrCreateDirs(config);

  return config;
}

// 导出配置
module.exports = renderConfig();
