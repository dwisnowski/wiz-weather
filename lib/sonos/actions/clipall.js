'use strict';

var settings = require('../../settings');
var allPlayerAnnouncement = require('../helpers/all-player-announcement');

var port = void 0;

function playClipOnAll(player, values) {
  var clipFileName = values[0];
  var announceVolume = settings.announceVolume || 40;

  if (/^\d+$/i.test(values[1])) {
    // first parameter is volume
    announceVolume = values[1];
  }

  return allPlayerAnnouncement(player.system, 'http://' + player.system.localEndpoint + ':' + port + '/clips/' + clipFileName, announceVolume);
}

module.exports = function (api) {
  port = api.getPort();
  api.registerAction('clipall', playClipOnAll);
};