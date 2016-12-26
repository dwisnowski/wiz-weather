import alertsService from './services/alerts';
import async from 'async';

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

function handleAlerts(alerts, api) {
    if (alerts.length > 0) {
        var tasks = [
            (next) => {
                api.runAction('Kitchen', 'say', ['the-following-are-alerts-for-your-area']);
                next();
            },
            delayEverything
        ];

        alerts.map((alert) => {
            tasks.push((next) => {
                var text = alert.replace(new RegExp(' ', 'g'), '-');
                console.log('textToSay: ' + text);
                api.runAction('Kitchen', 'say', [text]);
                next();
            });
            tasks.push(delayEverything);
        });

        async.series(tasks, (err, results) => {
        });
    }
}

module.exports = {
    run(api, locationNameOrZipCode) {
        setUpArrayCleanFunction();

        alertsService.get(locationNameOrZipCode, (err, alerts) => {
            console.log('err: ' + err);
            console.log('alerts: ' + alerts);

            alerts.push('test-one-with-words');
            alerts.push('test two with some words');
            handleAlerts(alerts, api);
        });
    }
};
