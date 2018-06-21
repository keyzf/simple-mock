const simpleMock = require('./simple-mock');
const saveApi = require('./save-api');
const utils = require('./utils');

console.log(
  utils.chalk.green(
    `isEnableMock=${utils.config.isEnableMock}, isAutoSaveApi=${
      utils.config.isAutoSaveApi
    }, isForceSaveApi=${utils.config.isForceSaveApi}`
  )
);

module.exports = {
  render(req, res, apiPath) {
    if (!utils.config.isEnableMock) {
      return false;
    }

    // console.log(
    //   '[try mock url]',
    //   req.hostname,
    //   req.url,
    //   req._parsedUrl.pathname
    // ); // req._parsedUrl, req.query
    return simpleMock(req, res);
  },
  saveApi() {
    if (!utils.config.isAutoSaveApi) {
      return;
    }

    return saveApi.apply(this, arguments);
  }
};
