'use strict';

function favorites(player, values) {

  return player.system.getFavorites().then(function (favorites) {

    if (values[0] === 'detailed') {
      return favorites;
    }

    // only present relevant data
    return favorites.map(function (i) {
      return i.title;
    });
  });
}

module.exports = function (api) {
  api.registerAction('favorites', favorites);
  api.registerAction('favourites', favorites);
};