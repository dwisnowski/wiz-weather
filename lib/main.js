'use strict';

var _alerts = require('./services/alerts');

var _alerts2 = _interopRequireDefault(_alerts);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function setUpArrayCleanFunction() {
    Array.prototype.clean = function (deleteValue) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == deleteValue) {
                this.splice(i, 1);
                i--;
            }
        }
        return this;
    };
}

function delayEverything(next) {
    setTimeout(function () {
        next();
    }, 5000);
}

function handleAlerts(alerts, api) {
    if (alerts.length > 0) {
        var tasks = [function (next) {
            api.runAction('Kitchen', 'say', ['the-following-are-alerts-for-your-area']);
            next();
        }, delayEverything];

        alerts.map(function (alert) {
            tasks.push(function (next) {
                var text = alert.replace(new RegExp(' ', 'g'), '-');
                console.log('textToSay: ' + text);
                api.runAction('Kitchen', 'say', [text]);
                next();
            });
            tasks.push(delayEverything);
        });

        _async2.default.series(tasks, function (err, results) {});
    }
}

module.exports = {
    run: function run(api, locationNameOrZipCode) {
        setUpArrayCleanFunction();

        _alerts2.default.get(locationNameOrZipCode, function (err, alerts) {
            console.log('err: ' + err);
            console.log('alerts: ' + alerts);

            handleAlerts(alerts, api);
        });
    }
};