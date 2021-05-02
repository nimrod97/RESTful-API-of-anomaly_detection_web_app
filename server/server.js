var express = require('express');
var app = express();
var fs = require("fs");
const bp = require('body-parser');

app.use(bp.json());
app.use(bp.urlencoded({extended: true}));

var server = app.listen(9876, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Web app listening at http://%s:%s", host, port);
})

app.get('/', function (req, res) {
    res.status(200);
    // console.log(model);
    // res.send(model);
    // res.end();
})

require('./anomaly')(app);
require('./model')(app);







