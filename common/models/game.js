'use strict';

module.exports = function(Game) {

    Game.spawnInterval = null;
    Game.currentGame = null;
    Game.numFlowers = 0;

    Game.startSpawner = function() {
        console.log("starting spawner");
        var Flower = Game.app.models.Flower;
        var filter = {
            where: {
                gameId: Game.currentGame.__data.id
            }
        }

        Flower.destroyAll(filter);
        Game.numFlowers = 0;

        Game.spawnInterval = setInterval(function() {
            Game.spawnFlower();
        }, 1000);
    }

    Game.spawnFlower = function() {
        var type = Math.floor(Math.random() * 5);
        if (type > 1) type = 1;
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
            Game.app.io.emit('spawn', fl.__data);
            Game.numFlowers++;
            if (Game.numFlowers > 200) clearInterval(Game.spawnInterval);
        });

    };

    Game.generateDevice = function(deviceId, cb) {
        var filter = {
            where: {
                deviceId: deviceId
            }
        };

        var Device = Game.app.models.Device;

        Device.findOne(filter, function(err, device) {
            if (err) return cb(err);
            if (!device || device.length == 0) {
                device = {
                        deviceId: deviceId,
                        r: Math.floor(Math.random() * 256),
                        g: Math.floor(Math.random() * 256),
                        b: Math.floor(Math.random() * 256)
                    }
                    //3a185434a0ef325e875c9fe07a5cadbeb4c2686e
                Device.create(device, function(err, device) {
                    if (err) return cb(err);
                    console.log("New device created");
                    cb(null, device);
                    Game.app.io.emit('newdevice', device.__data);
                });
            } else {
                console.log("Existing Device");
                cb(null, device);
                Game.app.io.emit('newdevice', device.__data);
            }
        })
    }
    Game.stopSpawner = function() {
        clearInterval(Game.spawnInterval);
    }

    Game.join = function(deviceId, cb) {
        console.log("someone joined!");

        Game.generateDevice(deviceId, function(err, device) {
            if (err) cb(err);
            if (Game.currentGame) return Game.joinCB(cb, Game.currentGame, device);
            var filter = {
                where: {
                    status: 0
                },
                include: ["flowers", "devices"]
            };
            Game.find(filter, function(err, games) {
                if (err) return cb(err);
                try {
                    if (games && games.length > 0) {
                        Game.currentGame = games[0];
                        return Game.joinCB(cb, Game.currentGame, device);
                    }

                    Game.create({ name: "test game", status: 0, max_x: 500, max_y: 500 }, function(err, game) {
                        if (err) return cb(err);
                        Game.currentGame = game;
                        return Game.joinCB(cb, Game.currentGame, device);
                    });
                } catch (e) {
                    cb(e);
                }
            });
        });
    };

    Game.joinCB = function(cb, game, device) {
        return cb(null, {
            id: device.id,
            points: device.points,
            deviceId: device.deviceId,
            r: device.r,
            g: device.g,
            b: device.b,
            gameId: game.id,
            status: game.status,
            name: game.name,
            max_x: game.max_x,
            max_y: game.max_y
        })
    }

    Game.remoteMethod(
        'join', {
            accepts: [{ arg: 'deviceId', type: 'string', required: true }],
            description: "Ask Game Info to Join In",
            returns: { root: true, type: 'object' },
            http: { arg: 'post', path: '/join' }
        }
    );

    Game.collision = function(deviceId, flowerId, cb) {
        console.log("someone collided!");
        var Flower = Game.app.models.Flower;
        var Device = Game.app.models.Device;
        //Is it possible the we count multiple collisions as good, due to latency on this operation.
        //fuck it, good enough for this weekend
        Flower.find({ where: { id: flowerId } }, function(err, flower) {
            if (err || !flower || flower.length == 0) return cb(err);
            flower = flower[0];
            if (flower.__data.pollinated) return cb(new Error("Flower was already pollinated"));
            flower.__data.pollinated = true;
            flower.__data.deviceId = deviceId;
            flower.updateAttributes({ "pollinated": true, "deviceId": deviceId });

            Device.find({ where: { id: deviceId } }, function(err, device) {
                if (err || !device || device.length == 0) return cb(err);
                device = device[0];
                device.__data.points = device.__data.points + 1;
                device.updateAttribute("points", device.__data.points);
                cb(null, device);
                Game.app.io.emit('points', device.__data);
            });
        });
    };

    Game.remoteMethod(
        'collision', {
            accepts: [
                { arg: 'deviceId', type: 'number', required: true },
                { arg: 'flowerId', type: 'number', required: true }
            ],
            description: " collision",
            returns: { arg: 'device', type: 'object' },
            http: { arg: 'post', path: '/collision' }
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