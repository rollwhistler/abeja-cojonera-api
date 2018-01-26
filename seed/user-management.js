'use strict';

var Q = require('q');

module.exports = function(app) {

    var db = app.dataSources.db;

    return Q.all([
        Q.ninvoke(db, 'automigrate', 'Role'),
        Q.ninvoke(db, 'automigrate', 'roleMapping'),
        Q.ninvoke(db, 'automigrate', 'ACL'),
        Q.ninvoke(db, 'automigrate', 'AccessToken'),
        Q.ninvoke(db, 'automigrate', 'refreshToken'),
        Q.ninvoke(db, 'automigrate', 'user')
    ]);

};