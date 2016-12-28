'use strict';

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _https = require('https');

var _https2 = _interopRequireDefault(_https);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _basicAuth = require('basic-auth');

var _basicAuth2 = _interopRequireDefault(_basicAuth);

var _logger = require('sonos-discovery/lib/helpers/logger');

var _logger2 = _interopRequireDefault(_logger);

var _nodeStatic = require('node-static');

var _nodeStatic2 = _interopRequireDefault(_nodeStatic);

var _settings = require('./settings');

var _settings2 = _interopRequireDefault(_settings);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fileServer = new _nodeStatic2.default.Server(_settings2.default.webroot);
var discovery = {};
var api = {};

var requestHandler = function requestHandler(req, res) {
    req.addListener('end', function () {
        fileServer.serve(req, res, function (err) {

            // If error, route it.
            // This bypasses authentication on static files!
            if (!err) {
                return;
            }

            if (_settings2.default.auth) {
                var credentials = (0, _basicAuth2.default)(req);

                if (!credentials || credentials.name !== _settings2.default.auth.username || credentials.pass !== _settings2.default.auth.password) {
                    res.statusCode = 401;
                    res.setHeader('WWW-Authenticate', 'Basic realm="Access Denied"');
                    res.end('Access denied');
                    return;
                }
            }

            // Enable CORS requests
            res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Origin', '*');
            if (req.headers['access-control-request-headers']) {
                res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
            }

            if (req.method === 'OPTIONS') {
                res.end();
                return;
            }

            if (req.method === 'GET') {
                api.requestHandler(req, res);
            }
        });
    }).resume();
};

module.exports = function (argApi, argDiscovery) {
    discovery = argDiscovery;
    api = argApi;

    var server = void 0;

    if (_settings2.default.https) {
        var options = {};
        if (_settings2.default.https.pfx) {
            options.pfx = _fs2.default.readFileSync(_settings2.default.https.pfx);
            options.passphrase = _settings2.default.https.passphrase;
        } else if (_settings2.default.https.key && _settings2.default.https.cert) {
            options.key = _fs2.default.readFileSync(_settings2.default.https.key);
            options.cert = _fs2.default.readFileSync(_settings2.default.https.cert);
        } else {
            _logger2.default.error("Insufficient configuration for https");
            process.exit(1);
        }

        var secureServer = _https2.default.createServer(options, requestHandler);
        secureServer.listen(_settings2.default.securePort, function () {
            _logger2.default.info('https server listening on port', _settings2.default.securePort);
        });
    }

    server = _http2.default.createServer(requestHandler);

    process.on('unhandledRejection', function (err) {
        _logger2.default.error(err);
    });

    server.listen(_settings2.default.port, function () {
        _logger2.default.info('http server listening on port', _settings2.default.port);
    });

    server.on('error', function (err) {
        if (err.code && err.code === 'EADDRINUSE') {
            _logger2.default.error('Port ' + _settings2.default.port + ' seems to be in use already. Make sure the sonos-http-api isn\'t \n    already running, or that no other server uses that port. You can specify an alternative http port \n    with property "port" in settings.json');
        } else {
            _logger2.default.error(err);
        }

        process.exit(1);
    });
};