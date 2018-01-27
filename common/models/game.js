'use strict';

module.exports = function(Game) {

    Game.spawnInterval = null;
    Game.currentGame = null;

    Game.startSpawner = function() {
        console.log("starting spawner");
        var Flower = Game.app.models.Flower;
        var filter = {
            where: {
                gameId: Game.currentGame.__data.id
            }
        }

        Flower.destroyAll(filter);

        Game.spawnInterval = setInterval(function() {
            Game.spawnFlower();
        }, 1000);
    }

    Game.spawnFlower = function() {
        var type = Math.floor(Math.random() * 3);
        var x = Math.floor(Math.random() * 501);
        var y = Math.floor(Math.random() * 501);
        var flower = {
            pollinated: false,
            deviceId: null,
            gameId: Game.currentGame.__data.id,
            type: type,
            x: x,
            y: y
        };

        var Flower = Game.app.models.Flower;
        Flower.create(flower, function(err, fl) {
            if (err) return console.log(err.message);
            console.log("spawning flower");
            Game.app.io.emit('spawn', flower);
        });

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
                    return cb(null, games[0]);
                }

                Game.create({ name: "test game", status: 0, max_x: 500, max_y: 500 }, function(err, game) {
                    if (err) return cb(err);
                    Game.currentGame = game;
                    return cb(null, game);
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
            returns: { arg: 'game', type: 'object' },
            http: { arg: 'post', path: '/join' }
        }
    );

    Game.observe('after save', function(ctx, next) {
        if (ctx.isNewInstance) {
            setTimeout(Game.startSpawner, 100);
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
};