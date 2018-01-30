'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');

var app = module.exports = loopback();

app.start = function() {
    // start the web server
    return app.listen(function() {
        app.emit('started');
        var baseUrl = app.get('url').replace(/\/$/, '');
        console.log('Web server listening at: %s', baseUrl);
        if (app.get('loopback-component-explorer')) {
            var explorerPath = app.get('loopback-component-explorer').mountPath;
            console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
        }
    });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
    if (err) throw err;

    // start the server if `$ node server.js`
    if (require.main === module) {
        app.io = require('socket.io')(app.get('socket_port'));
        app.io.set('transports', ['xhr-polling']);
        app.io.set('polling duration', 10);
        app.start();

        /*setTimeout(function() {
            console.log("app initialized!");
            app.io.on("join", function() {
                console.log("someone joined!");
                app.models.Game.join(function() {});
            });
        }, 500);*/

    }

});