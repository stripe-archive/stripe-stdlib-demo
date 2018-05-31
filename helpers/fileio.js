const fs = require('fs');
const path = require('path');

/**
 * Read files in a directory, for mapping /public files to the public.
 */
module.exports = {
  readFiles: function(base, dir, files) {
    dir = dir || '';
    files = files || {};
    let pathname = path.join(base, dir);
    let dirList = fs.readdirSync(pathname);

    for (let i = 0; i < dirList.length; i++) {
      let dirpath = path.join(dir, dirList[i]);
      let dirname = dirpath.split(path.sep).join('/');
      let fullpath = path.join(pathname, dirList[i]);
      if (fs.lstatSync(fullpath).isDirectory()) {
        this.readFiles(base, dirpath, files);
      } else {
        files[dirname] = fs.readFileSync(fullpath);
      }
    }

    return files;
  },
};
