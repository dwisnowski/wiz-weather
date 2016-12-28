'use strict';

function simplify(items) {
  return items.map(function (item) {
    return {
      title: item.title,
      artist: item.artist,
      album: item.album,
      albumArtUri: item.albumArtUri
    };
  });
}

function queue(player, values) {
  var detailed = values[0] === 'detailed';

  var promise = player.coordinator.getQueue();

  if (detailed) {
    return promise;
  }

  return promise.then(simplify);
}

module.exports = function (api) {
  api.registerAction('queue', queue);
};