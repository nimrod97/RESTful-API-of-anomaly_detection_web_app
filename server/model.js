var fs = require('fs');

class model {
    static ids = 1;

    constructor() {
        this.model_id = model.ids;
        this.upload_time = getTime();
        this.status = "pending";
        model.ids++;
    }

    changeStatus() {
        this.status = "ready";
    }

}

var models = [];
global.anomaliesData = [];

module.exports = function (app) {
    app.get('/api/model', function (req, res) {
        for (let i = 0; i < models.length; i++) {
            if (models[i].model_id === JSON.parse(req.query.model_id)) {
                res.status(200);
                res.send(JSON.stringify(models[i])).end();
            }
        }
        res.status(404).end();
    })

    app.post('/api/model', function (req, res) {
        res.status(200);
        var anomalyDetector = require('./anomalyDetector');
        var m = new model();
        var a = new anomalyDetector(req.query, req.body, m);
        res.send(m).end();
        models.push(m);
        anomaliesData.push(a);
        // savedData.push(data);
        updateFile("models.csv", models);
        updateFile("anomaliesData.csv", anomaliesData);
        var body = req.body;
        var keys = Object.keys(body);
        a.learn(body, keys);
        m.changeStatus();
        // data=Object.assign(a,m);
        updateFile("models.csv", models);
        updateFile("anomaliesData.csv", anomaliesData);
    })

    app.delete('/api/model', function (req, res) {
        for (let i = 0; i < models.length; i++) {
            if (models[i].model_id === JSON.parse(req.query.model_id)) {
                res.status(200).end();
                models.splice(i, 1);
            }
        }
        res.status(404).end();
    })


    app.get('/api/models', function (req, res) {
        if (models.length === 0)
            res.status(404).end();
        else {
            res.send(JSON.stringify(models)).end();
        }
    })
}

function getTime() {
    var currentDate = new Date();
    var x = currentDate.toString().split("+")[2];
    x = x.replace(":", ".");
    x = "+" + x.replace(")", "");
    var y = JSON.stringify(currentDate).split(".")[0];
    y = y.toString();
    y = y.replace('"', "");
    return y + x;
}

function updateFile(file, arr) {
    let csv = arrayToCSV(arr);
    fs.writeFile(file, csv, function (err) {
        if (err) throw err;
    })
}

function arrayToCSV(data) {
    let csv = data.map(row => Object.values(row));
    csv.unshift(Object.keys(data[0]));
    return csv.join('\r\n');
}



