'use strict';

var path = require('path');
var fs = require('fs');

module.exports = function(app) {

    var loopback = app.loopback;
    var env = process.env.NODE_ENV || 'local';
    console.log("Current ENV: " + env);
    if (env != 'local') {
        var publicPath = path.resolve(__dirname, '../../client');
        app.use(loopback.static(publicPath));


        app.use(function redirectUnmatched(req, res) {

            res.setHeader('content-type', 'text/html');
            fs.createReadStream(publicPath + '/index.html')
                .pipe(res);

        });
    }

};