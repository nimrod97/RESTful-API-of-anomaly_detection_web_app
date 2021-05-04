var fs = require('fs');

module.exports = function (app) {
    app.post('/api/anomaly', function (req, res) {
        fs.readFile('anomaliesData.json', 'utf8', (err, data) => {
            if (err) throw err;
            else {
                const file = JSON.parse(data);
                let flag = false;
                for (let i = 0; i < file.anomaliesData.length; i++) {
                    if (JSON.parse(file.anomaliesData[i].model_id) === JSON.parse(req.query.model_id)) {
                        flag = true;
                        if (Object.keys(req.body).length < file.anomaliesData[i].columns.length) {
                            res.status(400).send("less columns than in train data").end();
                            break;
                        }
                        // check if the names of the columns are same as in learn algorithm
                        for (let j = 0; j < file.anomaliesData[i].columns.length; j++) {
                            let flag1 = false;
                            for (let k = 0; k < Object.keys(req.body).length; k++) {
                                if (file.anomaliesData[i].columns[j].localeCompare(Object.keys(req.body)[k]) === 0) {
                                    flag1 = true;
                                    break;
                                }
                            }
                            if (!flag1) {
                                res.status(400).send("at least one column name from train data doesn't exist").end();
                                break;
                            }
                        }
                        // we can detect
                        const anomalyDetector = require('./anomalyDetector');
                        let anomaly=new anomalyDetector(file.anomaliesData[i].model_type,req.body,file.anomaliesData[i].model_id);
                        Object.assign(anomaly,file.anomaliesData[i])
                        anomaly.detect(req.body);
                        file.anomaliesData[i]=anomaly;
                        res.status(200).send(file.anomaliesData[i].anomalies).end();
                        const json = JSON.stringify(file, null, 2);
                        fs.writeFile('anomaliesData.json', json, 'utf8', (err) => {
                            if (err) throw err;
                        });
                        break;
                    }
                }
                if (!flag) //redirect - the model is not ready
                    res.redirect(301, '/api/model?model_id=' + id).end();
            }
        });
    })

}
