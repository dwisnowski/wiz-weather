'use strict';

var logger = require('sonos-discovery/lib/helpers/logger');
var isRadioOrLineIn = require('../helpers/is-radio-or-line-in');
var onOneBigGroup = void 0;
var globalListenerRegistered = false;

function saveAll(system) {
  var backupPresets = system.zones.map(function (zone) {
    var coordinator = zone.coordinator;
    var state = coordinator.state;
    var preset = {
      players: [{ roomName: coordinator.roomName, volume: state.volume }],
      state: state.playbackState,
      uri: coordinator.avTransportUri,
      metadata: coordinator.avTransportUriMetadata,
      playMode: {
        repeat: state.playMode.repeat
      }
    };

    if (!isRadioOrLineIn(preset.uri)) {
      preset.trackNo = state.trackNo;
      preset.elapsedTime = state.elapsedTime;
    }

    zone.members.forEach(function (player) {
      if (coordinator.uuid != player.uuid) preset.players.push({ roomName: player.roomName, volume: player.state.volume });
    });

    return preset;
  });

  return backupPresets;
}

function topologyChanged() {
  if (onOneBigGroup instanceof Function) {
    onOneBigGroup();
  }
}

function announceAll(system, uri, volume) {
  if (!globalListenerRegistered) {
    system.on('topology-change', topologyChanged);
    globalListenerRegistered = true;
  }

  // Save all players
  var backupPresets = saveAll(system);

  // find biggest group and all players
  var allPlayers = [];
  var biggestZone = {};
  system.zones.forEach(function (zone) {
    if (!biggestZone.members || zone.members.length > biggestZone.members.length) {
      biggestZone = zone;
    }
  });

  var coordinator = biggestZone.coordinator;

  allPlayers.push({ roomName: coordinator.roomName, volume: volume });

  system.players.forEach(function (player) {
    if (player.uuid == coordinator.uuid) return;
    allPlayers.push({ roomName: player.roomName, volume: volume });
  });

  var preset = {
    uri: uri,
    players: allPlayers,
    playMode: {
      repeat: false
    },
    pauseOthers: true,
    state: 'STOPPED'
  };

  var announceFinished = void 0;
  var afterPlayingStateChange = void 0;

  var onTransportChange = function onTransportChange(state) {
    logger.debug(coordinator.roomName, state.playbackState);

    if (state.playbackState === 'PLAYING') {
      afterPlayingStateChange = announceFinished;
    }

    if (state.playbackState !== "STOPPED") {
      return;
    }

    if (afterPlayingStateChange instanceof Function) {
      logger.debug('announcement finished');
      afterPlayingStateChange();
    }
  };

  return system.applyPreset(preset).then(function () {
    if (system.zones.length === 1) return;

    return new Promise(function (resolve) {
      onOneBigGroup = resolve;
    });
  }).then(function () {
    return coordinator.play();
  }).then(function () {
    coordinator.on('transport-state', onTransportChange);
    return new Promise(function (resolve) {
      announceFinished = resolve;
    });
  }).then(function () {
    logger.debug('removing listener from', coordinator.roomName);
    coordinator.removeListener('transport-state', onTransportChange);
  }).then(function () {
    logger.debug(backupPresets);
    return backupPresets.reduce(function (promise, preset) {
      return promise.then(function () {
        return system.applyPreset(preset);
      });
    }, Promise.resolve());
  }).catch(function (err) {
    logger.error(err.stack);
    coordinator.removeListener('transport-state', onTransportChange);
  });
}

module.exports = announceAll;