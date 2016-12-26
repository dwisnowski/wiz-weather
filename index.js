const SonosSystem = require('sonos-discovery');
var SonosHttpAPI = require('./lib/sonos/sonos-http-api.js');
var settings = require('./lib/settings');

var discovery = new SonosSystem(settings);
const SIXTY_SECONDS = 60000;

function runServer(api) {
    var server = require('./lib/server');
    server(api, discovery);
}
function checkForAlerts(api) {
    var main = require('./lib/main');
    main.run(api, '60107');
}

function runAlertService(api) {
    checkForAlerts(api);
    setInterval(function () {
        checkForAlerts(api);
    }, SIXTY_SECONDS);
}

setTimeout(function () {
    var api = new SonosHttpAPI(discovery, settings);

    runServer(api);
    runAlertService(api);
}, 1000);
