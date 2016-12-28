'use strict';

var path = require('path');
var crypto = require('crypto');
var fs = require('fs');
var http = require('http');
var settings = require('../../settings');
var singlePlayerAnnouncement = require('../helpers/single-player-announcement');

var port = void 0;

var backupPresets = {};

function playClip(player, values) {
  var clipFileName = values[0];
  var announceVolume = settings.announceVolume || 40;

  if (/^\d+$/i.test(values[1])) {
    // first parameter is volume
    announceVolume = values[1];
  }

  return singlePlayerAnnouncement(player, 'http://' + player.system.localEndpoint + ':' + port + '/clips/' + clipFileName, announceVolume);
}

module.exports = function (api) {
  port = api.getPort();
  api.registerAction('clip', playClip);
};