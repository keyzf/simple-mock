const path = require('path');
const expect = require("chai").expect;
const utilsDir = require('../lib/utils-dir');
const utils = require('../lib/utils');
describe('utils-dir.js', () => {
  const abcDir = path.resolve(process.cwd(), 'a/b/c');
  const abcDirDel = path.resolve(process.cwd(), 'a');
  const abcDir2 = path.resolve(process.cwd(), 'a/b/c/dd');

  describe('utilsDir.mkDir', () => {
    it('创建一个 /a/b/c 目录，目录应该存在', function() {
      utilsDir.mkDir(abcDir);

      expect(utils.isExists(abcDir)).eq(true);
    });
  });

  describe('utilsDir.mkDir', () => {
    it('删除一个已经存在的深度目录 /a/b/c', function() {
      utilsDir.delDir(abcDirDel);
      expect(utils.isExists(abcDir)).eq(false);
    });

    it('删除一个不存在的深度目录 /a/b/c/dd，应该返回 0', function() {
      expect(utilsDir.delDir(abcDir2)).eq(0);
    });
  })
});
