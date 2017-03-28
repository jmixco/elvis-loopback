'use strict';
var app = require('../../server/server');
module.exports = function (Productlike) {

    //Productlike.observe('after save', function (ctx, next) {
    //    if (ctx.instance) {
    //        console.log('Saved %s#%s', ctx.Model.modelName, ctx.instance.id);

    //        updateLikesCount(ctx.instance.productId,0);

    //    } else {
    //        console.log('Updated %s matching %j',
    //            ctx.Model.pluralModelName,
    //            ctx.where);
    //    }
    //    next();
    //});

    //Productlike.observe('before delete', function (ctx, next) {
    //    console.log('Deleted %s matching %j',
    //        ctx.Model.pluralModelName,
    //        ctx.where);

    //    updateLikesCount(ctx.instance.productId,-1);
    //    next();
    //});

    function updateLikesCount(productId,add) {
        var Product = app.models.Product;

        Productlike.count({ productId: productId })
            .then((count) => {
                if (count) {
                    return Product.findById(productId)
                        .then((product) => {
                            if (product) {
                                product.likeCount = count+add;
                            }
                            return product.save();
                        });

                }
            });

    }
};
