'use strict';

var path = require('path');
var requireDir = require('sonos-discovery/lib/helpers/require-dir');
var providers = [];

requireDir(path.join(__dirname, '../tts-providers'), function (provider) {
  providers.push(provider);
});

providers.push(require('../tts-providers/default/google'));

function tryDownloadTTS(phrase, language) {
  var path = void 0;
  return providers.reduce(function (promise, provider) {
    return promise.then(function () {
      if (path) return path;
      return provider(phrase, language).then(function (_path) {
        path = _path;
        return path;
      });
    });
  }, Promise.resolve());
}

module.exports = tryDownloadTTS;