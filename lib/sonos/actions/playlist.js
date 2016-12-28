'use strict';

function playlist(player, values) {
  var playlistName = decodeURIComponent(values[0]);
  return player.coordinator.replaceWithPlaylist(playlistName).then(function () {
    return player.coordinator.play();
  });
}

module.exports = function (api) {
  api.registerAction('playlist', playlist);
};