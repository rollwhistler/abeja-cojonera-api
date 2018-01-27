'use strict';

module.exports = function(Game) {

    Game.spawnInterval = null;
    Game.currentGame = null;
    Game.flowers = [];

    Game.startSpawner = function() {
        console.log("starting spawner");
        Game.flowers = [];
        Game.spawnInterval = setInterval(function() {
            Game.spawnFlower();
        }, 500);
    }

    Game.spawnFlower = function() {
        var type = Math.floor(Math.random() * 3);
        var x = Math.floor(Math.random() * 501);
        var y = Math.floor(Math.random() * 501);
        var flower = {
            pollinated: false,
            deviceId: null,
            type: type,
            x: x,
            y: y,
            index: Game.flowers.length
        };
        Game.flowers.push(flower);
        console.log("spawning flower");
        app.io.emit('spawn', flower);
    };

    Game.stopSpawner = function() {
        clearInterval(Game.spawnInterval);
    }

    Game.join = function(cb) {
        var filter = {
            where: {
                status: 0
            }
        };
        Game.find(filter, function(err, games) {
            if (err) return cb(err);
            try {
                if (games && games.length > 0) {
                    Game.currentGame = games[0];
                    return cb(null, games[0].__data.id);
                }

                Game.create({ name: "test game", status: 0, max_x: 500, max_y: 500 }, function(err, game) {
                    if (err) return cb(err);
                    Game.currentGame = game;
                    return cb(null, game.__data.id);
                });
            } catch (e) {
                cb(e);
            }
        });
    };

    Game.remoteMethod(
        'join', {
            accepts: [],
            description: "Ask Game Info to Join In",
            returns: { arg: 'gameId', type: 'number' },
            http: { arg: 'post', path: '/join' }
        }
    );

    Game.observe('after save', function(ctx, next) {
        if (ctx.isNewInstance) {
            Game.startSpawner();
        } else {
            if (ctx.instance) {
                var model = ctx.instance;
                if (model.status != 0) {
                    Game.stopSpawner();
                } else if (!Game.spawnInterval) {
                    Game.startSpawner();
                }
            }
        }
        next();
    });

    Game.afterInitialized = function() {
        app.io.on("join", function() {
            console.log("someone joined!");
            Game.join(function() {});
        });
    };
};