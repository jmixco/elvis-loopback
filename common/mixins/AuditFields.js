module.exports = function(Model, options) {
  // Model is the model class
  // options is an object containing the config properties from model definition
  Model.defineProperty('created', {type: Date, default: '$now'});
  Model.defineProperty('modified', { type: Date, default: '$now' });

  'use strict';
  Model.observe('before save', function event(ctx, next) { //Observe any insert/update event on Model
      if (ctx.instance) {
          ctx.instance.modified = new Date();
      } else {
          ctx.data.modified = new Date();
      }
      next();
  });
}