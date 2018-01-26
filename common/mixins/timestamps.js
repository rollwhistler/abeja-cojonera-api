'use strict';

var debug = require('debug')('b2b-timestamp-mixin');

module.exports = function timestamp(Model, options) {

    debug('Timestamp mixin for Model %s', Model.modelName);

    var created = options.created || 'created';
    var updated = options.updated || 'updated';

    debug('created', created, options.created);
    debug('updated', updated, options.updated);

    Model.defineProperty(created, { type: Date, required: true, defaultFn: 'now' });
    Model.defineProperty(updated, { type: Date, required: true });

    Model.observe('before save', function event(ctx, next) {
        if (ctx.instance) {
            debug('%s.%s before save: %s', ctx.Model.modelName, updated, ctx.instance.id);
            ctx.instance[updated] = new Date();
        } else {
            debug('%s.%s before update matching %j', ctx.Model.pluralModelName, updated, ctx.where);
            ctx.data[updated] = new Date();
        }
        next();
    });

};