const path = require('path');
const expect = require("chai").expect;
const utils = require('../lib/utils');

describe('utils.js', () => {
  let config;

  beforeEach(() => {
    config = require('../lib/config');
  });

  describe('utils.getDataFilePath', () => {
    it('test getDataFilePath for mockdata', function() {
      let path = utils.getDataFilePath('/aa/bb/cc');
      path = path.replace(config.mockDataPath, '');
      expect(path).equal('\\aa_bb_cc.js');
    });

    it('test getDataFilePath for customdata', function() {
      let path = utils.getDataFilePath('/aa/bb/cc', 'customdata');
      path = path.replace(config.customDataPath, '');
      expect(path).equal('\\aa_bb_cc.js');
    });
  })

  describe('utils.isExists', () => {
    it('文件应该存在', function() {
      const res = utils.isExists(__dirname);
      expect(res).eq(true);
    });

    it('文件不存在测试', function() {
      const res = utils.isExists('/abc');
      expect(res).eq(false);
    });
  })
});
