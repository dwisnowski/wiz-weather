import alertsService from './services/alerts';
import async from 'async';

const SIXTY_SECONDS = 60000;

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
    setTimeout(() => {
        next();
    }, 5000);
}

function handleAlerts(alerts, api, zoneNameToAnnounceIn) {
    if (alerts.length > 0) {
        var tasks = [
            (next) => {
                api.runAction(zoneNameToAnnounceIn, 'say', ['the-following-are-alerts-for-your-area']);
                next();
            },
            delayEverything
        ];

        alerts.map((alert) => {
            tasks.push((next) => {
                var text = alert.replace(new RegExp(' ', 'g'), '-');
                console.log('textToSay: ' + text);
                api.runAction(zoneNameToAnnounceIn, 'say', [text]);
                next();
            });
            tasks.push(delayEverything);
        });

        async.series(tasks, (err, results) => {
        });
    }
}

function checkForAlerts(api, locationNameOrZipCode, zoneNameToAnnounceIn) {
    alertsService.get(locationNameOrZipCode, (err, alerts) => {
        console.log('err: ' + err);
        console.log('alerts: ' + alerts);
        handleAlerts(alerts, api, zoneNameToAnnounceIn);
    });
}

module.exports = {
    run(api, locationNameOrZipCode, zoneNameToAnnounceIn, timeIntervalForCheckingAlertsInMillis) {
        setUpArrayCleanFunction();

        checkForAlerts(api, locationNameOrZipCode, zoneNameToAnnounceIn);
        setInterval(function () {
            checkForAlerts(api, locationNameOrZipCode, zoneNameToAnnounceIn);
        }, timeIntervalForCheckingAlertsInMillis || SIXTY_SECONDS);
    }
};
