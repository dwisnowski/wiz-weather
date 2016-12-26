import weather from 'weather-js';
import async from 'async';


function getWeatherAlerts(locationNameOrZipCode, callback) {
    weather.find({search: locationNameOrZipCode, degreeType: 'F'}, function (err, results) {
        console.log('----------------');
        console.log('results: ' + JSON.stringify(results));

        let alert = results[0].location.alert;

        if (alert.length > 0) {
            callback(err, alert)
        } else {
            callback(err);
        }
    });
}

module.exports = {
    get(locationNameOrZipCode, callback) {
        var alerts = [];

        async.parallel({
            weatherAlerts: (callback) => getWeatherAlerts(locationNameOrZipCode, callback)
        }, (err, results) => {
            alerts.push(results.weatherAlerts);

            alerts.clean();
            callback(err, alerts);
        });
    }
};
