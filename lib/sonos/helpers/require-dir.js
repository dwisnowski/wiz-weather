'use strict';

var fs = require('fs');
var path = require('path');

module.exports = function (cwd, cb) {
  var files = fs.readdirSync(cwd);

  files.map(function (name) {
    var fullPath = path.join(cwd, name);
    return {
      name: name,
      fullPath: fullPath,
      stat: fs.statSync(fullPath)
    };
  }).filter(function (file) {
    return !file.stat.isDirectory() && !file.name.startsWith('.') && file.name.endsWith('.js');
  }).forEach(function (file) {
    cb(require(file.fullPath));
  });
};