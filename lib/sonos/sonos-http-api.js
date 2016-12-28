'use strict';

var requireDir = require('./helpers/require-dir');
var path = require('path');
var request = require('sonos-discovery/lib/helpers/request');
var logger = require('sonos-discovery/lib/helpers/logger');

function HttpAPI(discovery, settings) {
    var _this = this;

    var port = settings.port;
    var actions = {};

    this.getPort = function () {
        return port;
    };

    this.discovery = discovery;

    discovery.on('transport-state', function (player) {
        invokeWebhook('transport-state', player);
    });

    discovery.on('topology-change', function (topology) {
        invokeWebhook('topology-change', topology);
    });

    discovery.on('volume-change', function (volumeChange) {
        invokeWebhook('volume-change', volumeChange);
    });

    discovery.on('mute-change', function (muteChange) {
        invokeWebhook('mute-change', muteChange);
    });

    // this handles registering of all actions
    this.registerAction = function (action, handler) {
        actions[action] = handler;
    };

    //load modularized actions
    requireDir(path.join(__dirname, './actions'), function (registerAction) {
        registerAction(_this);
    });

    this.runAction = function (playerName, actionName, args) {
        if (discovery.zones.length === 0) {
            var msg = 'No system has yet been discovered. Please see https://github.com/jishi/node-sonos-http-api/issues/77 if it doesn\'t resolve itself in a few seconds.';
            logger.error(msg);
            console.log('Failed -- error: ' + msg);
            process.exit(1);
        }

        console.log('playerName: ' + playerName);
        console.log('actionName: ' + actionName);
        console.log('args: ' + args);

        var player = discovery.getPlayer(playerName);
        console.log('player: ' + JSON.stringify(player));

        var opt = {};

        opt.player = player || discovery.getAnyPlayer();
        opt.action = (actionName || '').toLowerCase();
        opt.values = args;

        handleAction(opt).then(function (response) {
            console.log('Successful -- response: ' + response);
        }).catch(function (error) {
            console.log('Failed -- error: ' + error);
        });
    };

    function handleAction(options) {
        var player = options.player;

        if (!actions[options.action]) {
            return Promise.reject({ error: 'action \'' + options.action + '\' not found' });
        }

        return actions[options.action](player, options.values);
    }

    function invokeWebhook(type, data) {
        if (!settings.webhook) return;

        var jsonBody = JSON.stringify({
            type: type,
            data: data
        });

        var body = new Buffer(jsonBody, 'utf8');

        request({
            method: 'POST',
            uri: settings.webhook,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': body.length
            },
            body: body
        }).catch(function (err) {
            logger.error('Could not reach webhook endpoint', settings.webhook, 'for some reason. Verify that the receiving end is up and running.');
            logger.error(err);
        });
    }
}

module.exports = HttpAPI;