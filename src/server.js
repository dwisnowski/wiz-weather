'use strict';
import http from 'http';
import https from 'https';
import fs from 'fs';
import auth from 'basic-auth';
import logger from 'sonos-discovery/lib/helpers/logger';
import nodeStatic from 'node-static';
import settings from './settings';

const fileServer = new nodeStatic.Server(settings.webroot);
var discovery = {};
var api = {};

var requestHandler = function (req, res) {
    req.addListener('end', function () {
        fileServer.serve(req, res, function (err) {

            // If error, route it.
            // This bypasses authentication on static files!
            if (!err) {
                return;
            }

            if (settings.auth) {
                var credentials = auth(req);

                if (!credentials || credentials.name !== settings.auth.username || credentials.pass !== settings.auth.password) {
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


module.exports = (argApi, argDiscovery) => {
    discovery = argDiscovery;
    api = argApi;

    let server;

    if (settings.https) {
        var options = {};
        if (settings.https.pfx) {
            options.pfx = fs.readFileSync(settings.https.pfx);
            options.passphrase = settings.https.passphrase;
        } else if (settings.https.key && settings.https.cert) {
            options.key = fs.readFileSync(settings.https.key);
            options.cert = fs.readFileSync(settings.https.cert);
        } else {
            logger.error("Insufficient configuration for https");
            process.exit(1);
        }

        const secureServer = https.createServer(options, requestHandler);
        secureServer.listen(settings.securePort, function () {
            logger.info('https server listening on port', settings.securePort);
        });
    }

    server = http.createServer(requestHandler);

    process.on('unhandledRejection', (err) => {
        logger.error(err);
    });

    server.listen(settings.port, function () {
        logger.info('http server listening on port', settings.port);
    });

    server.on('error', (err) => {
        if (err.code && err.code === 'EADDRINUSE') {
            logger.error(`Port ${settings.port} seems to be in use already. Make sure the sonos-http-api isn't 
    already running, or that no other server uses that port. You can specify an alternative http port 
    with property "port" in settings.json`);
        } else {
            logger.error(err);
        }

        process.exit(1);
    });
};
