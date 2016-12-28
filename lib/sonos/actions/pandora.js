'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var promise = require('request-promise');
var Anesidora = require("anesidora");
var Fuse = require('fuse.js');
var settings = require('../../settings');

function getPandoraMetadata(id, title, auth) {
  return '<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/"\n        xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">\n        <item id="OOOX' + id + '" parentID="0" restricted="true"><dc:title>' + title + '</dc:title><upnp:class>object.item.audioItem.audioBroadcast</upnp:class>\n        <desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">SA_RINCON3_' + auth + '</desc></item></DIDL-Lite>';
}

function getPandoraUri(id, title, albumart) {
  if (albumart == undefined) {
    return 'pndrradio:' + id + '?sn=2';
  } else {
    return 'pndrradio:' + id + '?sn=2,"title":"' + title + '","albumArtUri":"' + albumart + '"';
  }
}

function pandora(player, values) {
  var cmd = values[0];

  function userLogin() {
    return new Promise(function (resolve, reject) {
      pAPI.login(function (err) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
    });
  }

  function pandoraAPI(command, parameters) {
    return new Promise(function (resolve, reject) {
      pAPI.request(command, parameters, function (err, result) {
        if (!err) {
          resolve(result);
        } else {
          console.log("pandoraAPI " + command + " " + JSON.stringify(parameters));
          console.log("ERROR: " + JSON.stringify(err));
          reject(err);
        }
      });
    });
  }

  function playPandora(player, name) {
    var uri = '';
    var metadata = '';

    return userLogin().then(function () {
      return pandoraAPI("user.getStationList", { "includeStationArtUrl": true });
    }).then(function (stationList) {
      return pandoraAPI("music.search", { "searchText": name }).then(function (result) {
        if (result.artists != undefined) {
          result.artists.map(function (artist) {
            if (artist.score > 90) {
              stationList.stations.push({ "stationId": artist.musicToken, "stationName": artist.artistName, "type": "artist" });
            }
          });
        }
        if (result.songs != undefined) {
          result.songs.map(function (song) {
            if (song.score > 90) {
              stationList.stations.push({ "stationId": song.musicToken, "stationName": song.songName, "type": "song" });
            }
          });
        }
        return pandoraAPI("station.getGenreStations", {});
      }).then(function (result) {
        result.categories.map(function (category) {
          category.stations.map(function (genreStation) {
            stationList.stations.push({ "stationId": genreStation.stationToken, "stationName": genreStation.stationName, "type": "song" });
          });
        });
        var fuzzy = new Fuse(stationList.stations, { keys: ["stationName"] });

        var results = fuzzy.search(name);
        if (results.length > 0) {
          var station = results[0];
          if (station.type == undefined) {
            uri = getPandoraUri(station.stationId, station.stationName, station.artUrl);
            metadata = getPandoraMetadata(station.stationId, station.stationName, settings.pandora.username);
            return Promise.resolve();
          } else {
            return pandoraAPI("station.createStation", { "musicToken": station.stationId, "musicType": station.type }).then(function (stationInfo) {
              uri = getPandoraUri(stationInfo.stationId);
              metadata = getPandoraMetadata(stationInfo.stationId, stationInfo.stationName, settings.pandora.username);
              return Promise.resolve();
            });
          }
        } else {
          return Promise.reject("No match was found");
        }
      }).then(function () {
        return player.coordinator.setAVTransport(uri, metadata);
      }).then(function () {
        return player.coordinator.play();
      });
    });
  }

  if (settings && settings.pandora) {
    var pAPI = new Anesidora(settings.pandora.username, settings.pandora.password);

    if (cmd == 'play') {
      return playPandora(player, values[1]);
    }if (cmd == 'thumbsup' || cmd == 'thumbsdown') {
      var uri = player.state.currentTrack.uri;

      if (uri.startsWith('pndrradio-http')) {
        var _ret = function () {
          var stationToken = uri.substring(uri.search('&x=') + 3);
          var trackToken = uri.substring(uri.search('&m=') + 3, uri.search('&f='));
          var up = cmd == 'thumbsup';

          return {
            v: userLogin().then(function () {
              return pandoraAPI("station.addFeedback", { "stationToken": stationToken, "trackToken": trackToken, "isPositive": up });
            }).then(function () {
              if (cmd == 'thumbsdown') {
                return player.coordinator.nextTrack();
              }
            })
          };
        }();

        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
      } else {
        return Promise.reject('The music that is playing is not a Pandora station');
      }
    }
  } else {
    console.log('Missing Pandora settings');
    return Promise.reject('Missing Pandora settings');
  }
}

module.exports = function (api) {
  api.registerAction('pandora', pandora);
};