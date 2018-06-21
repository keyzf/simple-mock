// mock 配置信息

module.exports = {
  mockFileDir: 'mock', // path.reslove(__dirname, 'mock'), // 指定 mock 文件存放的目录，注意：应当在 .gitignore 文件中忽略该目录
  isEnableMock: false, // 是否开启 Mock API 功能
  isAutoSaveApi: true, // 是否自动保存远端请求的 API
  isForceSaveApi: false // 是否强制保存，否则本地有时不再保存
};
