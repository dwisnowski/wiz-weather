'use strict';

var _weatherJs = require('weather-js');

var _weatherJs2 = _interopRequireDefault(_weatherJs);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getWeatherAlerts(locationNameOrZipCode, callback) {
    _weatherJs2.default.find({ search: locationNameOrZipCode, degreeType: 'F' }, function (err, results) {
        console.log('----------------');
        console.log('results: ' + JSON.stringify(results));

        var alert = results[0].location.alert;

        if (alert.length > 0) {
            callback(err, alert);
        } else {
            callback(err);
        }
    });
}

module.exports = {
    get: function get(locationNameOrZipCode, callback) {
        var alerts = [];

        _async2.default.parallel({
            weatherAlerts: function weatherAlerts(callback) {
                return getWeatherAlerts(locationNameOrZipCode, callback);
            }
        }, function (err, results) {
            alerts.push(results.weatherAlerts);

            alerts.clean();
            callback(err, alerts);
        });
    }
};