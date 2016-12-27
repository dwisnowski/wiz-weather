const SonosSystem = require('sonos-discovery');
var SonosHttpAPI = require('./lib/sonos/sonos-http-api.js');
var sonosSettings = require('./lib/settings');
var applicationSettings = require('./application-settings');
var main = require('./lib/main');

var discovery = new SonosSystem(sonosSettings);

function runServer(api) {
    var server = require('./lib/server');
    server(api, discovery);
}

//Main of this file
setTimeout(function () {
    var api = new SonosHttpAPI(discovery, sonosSettings);
    runServer(api);
    main.run(api, applicationSettings.locationForWeatherAlerts, applicationSettings.zoneNameToAnnouceIn, applicationSettings.timeIntervalForCheckingAlertsInMillis);
}, 1000);
