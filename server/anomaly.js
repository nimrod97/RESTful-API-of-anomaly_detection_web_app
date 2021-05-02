module.exports = function (app) {

    app.post('/api/anomaly', function (req, res) {
        var id = JSON.parse(req.query.model_id);
        for (let i = 0; i < global.anomaliesData.length; i++) {
            if (anomaliesData[i].model.model_id === id) {
                if (anomaliesData[i].model.status.localeCompare("ready") === 0) {
                    if (Object.keys(req.body).length < anomaliesData[i].columnLen) {
                        res.status(400)
                        res.send("less columns than in train data").end();
                        break;
                    }
                    anomaliesData[i].detect(req.body);
                    res.send(anomaliesData[i].anomalyReports);
                    res.status(200).end();
                    break;
                } else {
                    res.redirect(301, '/api/model?model_id=' + id);
                    res.end();
                    break;
                }

            }
        }
        res.status(404).end();
    })
}
