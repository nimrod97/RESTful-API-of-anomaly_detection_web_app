var fs = require('fs');

class model {
    constructor(id) {
        this.model_id = id;
        this.upload_time = getTime();
        this.status = "pending";
    }

}

module.exports = function (app) {
    app.get('/api/model', function (req, res) {
        fs.readFile('models.json','utf8',(err, data) =>{
            if(err) throw err;
            else {
                const file = JSON.parse(data);
                for (let i = 0; i < file.models.length; i++) {
                    if (JSON.parse(file.models[i].model_id) === JSON.parse(req.query.model_id)) {
                        res.status(200).send(JSON.stringify(file.models[i])).end();
                        break;
                    }
                }
                res.status(404).end();
            }
        })

    })

    app.post('/api/model', function (req, res) {
        var model_id = Date.now().toString();
        var m = new model(model_id);
        res.status(200).send(JSON.stringify(m)).end();
        const data = fs.readFileSync('models.json', {encoding: 'utf8', flag: 'r'});
        const file = JSON.parse(data);
        file.models.push(m);
        const json = JSON.stringify(file, null, 2);
        fs.writeFileSync('models.json', json);
        asyncLearn(m, req.query, req.body, model_id, Object.keys(req.body));
    });

    app.delete('/api/model', function (req, res) {
        fs.readFile('models.json','utf8',(err, data) =>{
            if(err) throw err;
            else {
                const file = JSON.parse(data);
                var flag=false;
                for (let i = 0; i < file.models.length; i++) {
                    if (JSON.parse(file.models[i].model_id) === JSON.parse(req.query.model_id)) {
                        flag=true;
                        file.models.splice(i, 1);
                        res.status(200).send("model "+JSON.parse(req.query.model_id)+" deleted").end();
                        break;
                    }
                }
                if(flag){
                    const json = JSON.stringify(file, null, 2);
                    fs.writeFile('models.json', json, 'utf8', (err) => {
                        if (err) throw err;
                    });
                }
                else
                    res.status(404).send("model doesn't exists").end();
            }
        })
        // delete also from anomaliesData file
        fs.readFile('anomaliesData.json', 'utf8', (err, data) => {
            if (err) throw err;
            else {
                const file = JSON.parse(data);
                for (let i = 0; i < file.anomaliesData.length; i++) {
                    if (JSON.parse(file.anomaliesData[i].model_id) === JSON.parse(req.query.model_id)) {
                        file.anomaliesData.splice(i, 1);
                        break;
                    }
                }
                const json = JSON.stringify(file, null, 2);
                fs.writeFile('anomaliesData.json', json, 'utf8', (err) => {
                    if (err) throw err;
                });

            }
        });
    })


    app.get('/api/models', function (req, res) {
        fs.readFile('models.json','utf8',(err, data) =>{
            if(err) throw err;
            else {
                const file = JSON.parse(data);
                if (file.models.length === 0)
                    res.status(404).send("No active models").end();
                else
                    res.status(200).send(JSON.stringify(file.models)).end();
            }
        })

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

async function asyncLearn(m, query, body, model_id, keys) {
    var anomalyDetector = require('./anomalyDetector');
    var a = new anomalyDetector(query, body, model_id);
    await a.learn(body, keys);
    updateModelsFile();
    updateAnomaliesDataFile(a);
}

function updateModelsFile() {
    fs.readFile('models.json', 'utf8', (err, data) => {
        if (err) throw err;
        else {
            const file = JSON.parse(data);
            file.models[file.models.length - 1].status = "ready";
            const json = JSON.stringify(file, null, 2);
            fs.writeFile('models.json', json, 'utf8', (err) => {
                if (err) throw err;
            });
        }
    });
}

function updateAnomaliesDataFile(a) {
    fs.readFile('anomaliesData.json', 'utf8', (err, data) => {
        if (err) throw err;
        else {
            const file = JSON.parse(data);
            file.anomaliesData.push(a);
            const json = JSON.stringify(file, null, 2);
            fs.writeFile('anomaliesData.json', json, 'utf8', (err) => {
                if (err) throw err;
            });

        }
    });
}




