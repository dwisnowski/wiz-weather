'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var fs = require('fs');
var util = require('util');
var path = require('path');
var logger = require('sonos-discovery/lib/helpers/logger');
var settings = require('../../settings');
var presetsFilename = __dirname + '/../../presets.json';
var presetsPath = settings.presetDir;
var presets = {};

function presetsAction(player, values) {
  var value = decodeURIComponent(values[0]);
  var preset = void 0;
  if (value.startsWith('{')) {
    preset = JSON.parse(value);
  } else {
    preset = presets[value];
  }

  if (preset) {
    return player.system.applyPreset(preset);
  } else {
    var simplePresets = Object.keys(presets);
    return Promise.resolve(simplePresets);
  }
}

function readPresetsFromDir(presets, presetPath) {
  var files = void 0;
  try {
    files = fs.readdirSync(presetPath);
  } catch (e) {
    logger.warn('Could not find dir ' + presetPath + ', are you sure it exists?');
    logger.warn(e.message);
    return;
  }

  files.map(function (name) {
    var fullPath = path.join(presetPath, name);
    return {
      name: name,
      fullPath: fullPath,
      stat: fs.statSync(fullPath)
    };
  }).filter(function (file) {
    return !file.stat.isDirectory() && !file.name.startsWith('.') && file.name.endsWith('.json');
  }).forEach(function (file) {
    var presetName = file.name.replace(/\.json/i, '');
    try {
      presets[presetName] = JSON.parse(fs.readFileSync(file.fullPath));
    } catch (err) {
      logger.warn('could not parse preset file ' + file.name + ' ("' + err.message + '"), please validate it with a JSON parser.');
    }
  });
}

function readPresetsFromFile(presets, filename) {
  try {
    var _ret = function () {
      var presetStat = fs.statSync(filename);
      if (!presetStat.isFile()) {
        return {
          v: void 0
        };
      }

      var filePresets = require(filename);
      Object.keys(filePresets).forEach(function (presetName) {
        presets[presetName] = filePresets[presetName];
      });

      logger.warn('You are using a presets.json file! ' + 'Consider migrating your presets into the presets/ ' + 'folder instead, and enjoy auto-reloading of presets when you change them');
    }();

    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
  } catch (err) {
    logger.debug('no presets.json file exists, skipping');
  }
}

function initPresets() {
  presets = {};
  readPresetsFromFile(presets, presetsFilename);
  readPresetsFromDir(presets, presetsPath);

  logger.info('Presets loaded:', util.inspect(presets, { depth: null }));
}

module.exports = function (api) {
  initPresets();
  var watchTimeout = void 0;
  try {
    fs.watch(presetsPath, { persistent: false }, function () {
      clearTimeout(watchTimeout);
      watchTimeout = setTimeout(initPresets, 200);
    });
  } catch (e) {
    logger.warn('Could not start watching dir ' + presetsPath + ', will not auto reload any presets. Make sure the dir exists');
    logger.warn(e.message);
  }
  api.registerAction('preset', presetsAction);
};