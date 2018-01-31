var cache = require('cache-control');

module.exports = function mountRestApi(app) {

    app.set('etag', 'strong');

    app.use(cache({
        '/**': 'public, max-age=0'
    }));

    var restApiRoot = app.get('restApiRoot');
    app.use(restApiRoot, app.loopback.rest());
};