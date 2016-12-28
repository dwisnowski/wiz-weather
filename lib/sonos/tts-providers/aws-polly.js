'use strict';

var crypto = require('crypto');
var fs = require('fs');
var http = require('http');
var path = require('path');
var AWS = require('aws-sdk');
var settings = require('../../settings');

var DEFAULT_SETTINGS = {
  OutputFormat: 'mp3',
  VoiceId: 'Joanna',
  TextType: 'text'
};

function polly(phrase, voiceName) {
  if (!settings.aws) {
    return Promise.resolve();
  }

  // Construct a filesystem neutral filename
  var dynamicParameters = { Text: phrase };
  var synthesizeParameters = Object.assign({}, DEFAULT_SETTINGS, dynamicParameters);
  if (settings.aws.name) {
    synthesizeParameters.VoiceId = settings.aws.name;
  }
  if (voiceName) {
    synthesizeParameters.VoiceId = voiceName;
  }

  var phraseHash = crypto.createHash('sha1').update(phrase).digest('hex');
  var filename = 'polly-' + phraseHash + '-' + synthesizeParameters.VoiceId + '.mp3';
  var filepath = path.resolve(settings.webroot, 'tts', filename);

  var expectedUri = '/tts/' + filename;
  try {
    fs.accessSync(filepath, fs.R_OK);
    return Promise.resolve(expectedUri);
  } catch (err) {
    console.log('announce file for phrase "' + phrase + '" does not seem to exist, downloading');
  }

  var constructorParameters = Object.assign({ apiVersion: '2016-06-10' }, settings.aws.credentials);

  var polly = new AWS.Polly(constructorParameters);

  return polly.synthesizeSpeech(synthesizeParameters).promise().then(function (data) {
    fs.writeFileSync(filepath, data.AudioStream);
    return expectedUri;
  });
}

module.exports = polly;