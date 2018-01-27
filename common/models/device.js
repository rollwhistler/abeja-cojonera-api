'use strict';

module.exports = function(Device) {
    Device.generateDevice = function(deviceId) {
        var filter = {
            where: {
                deviceId: deviceId
            }
        };

        Device.find(filter, function(device) {
            if (!device || device.length == 0) {
                device = {
                    deviceId: deviceId,
                    r: Math.floor(Math.random() * 256),
                    g: Math.floor(Math.random() * 256),
                    b: Math.floor(Math.random() * 256)
                }

                Device.create(device, function(err, device) {
                    Device.app.io.emit("joined", device);
                });
            } else {
                Device.app.io.emit("joined", device);
            }
        })

    };
};