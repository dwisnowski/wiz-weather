'use strict';

function linein(player, values) {
  var sourcePlayerName = values[0];
  var lineinSourcePlayer = player;

  if (sourcePlayerName) {
    lineinSourcePlayer = player.system.getPlayer(decodeURIComponent(sourcePlayerName));
  }

  if (!lineinSourcePlayer) {
    return Promise.reject(new Error('Could not find player ' + sourcePlayerName));
  }

  var uri = 'x-rincon-stream:' + lineinSourcePlayer.uuid;

  return player.coordinator.setAVTransport(uri).then(function () {
    return player.coordinator.play();
  });
}

module.exports = function (api) {
  api.registerAction('linein', linein);
};