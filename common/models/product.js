'use strict';
var app = require('../../server/server');
var loopback = require('loopback');

module.exports = function (Product) {
    Product.observe('access', function limitToTenant(ctx, next) {
        if (!ctx.query.where) {
            ctx.query.where = {};
        }
        ctx.query.where.active = true;
        next();
    });


    //Product.beforeRemote('**', function (ctx, user, next) {
    //    console.log(ctx.methodString, 'was invoked remotely'); // customers.prototype.save was invoked remotely
    //    next();
    //});
    Product.beforeRemote('deleteById', function (ctx, modelInstance, next) {
        //soft delete
        let id = ctx.args.id;
        Product.update({ id: id }, { active: false })
            .then((product) => {
                if (product.count>0) {
                    ctx.res.statusCode = 204;
                    ctx.res.end();
                } else {
                    ctx.res.statusCode = 404
                    ctx.res.end();
                }
                
            })
            .catch((err) => {
                ctx.res.statusCode = 500;
                ctx.res.send(err);
                //ctx.res.end();
            });
       
        
        //next();
    });
    function getCurrentUserId(ctx) {

        var accessToken = ctx.req.accessToken;//options && options.accessToken;
        var userId = accessToken && accessToken.userId;
        return userId;
    }
    Product.beforeRemote('find', function (context, modelInstance, next) {
        var reject = function () {
            process.nextTick(function () {
                next(null, false);
            });
        };



        //I get the details of the user who sent the request 
        //to learn which company does he belong to

        if (!context.args.filter)
            context.args.filter = {};
        if (!context.args.filter.order) {
            context.args.filter.order = ['name ASC'];
        }
        //context.args.filter.where = { brandId: user.companyId };
        console.log(context.args.filter);
        next();


    });
    //Location.disableRemoteMethodByName('prototype.updateAttributes');
    Product.buy = function (ctx, options, data, id, cb) {
        // request/ response ctx.req/ ctx.res
        //request body ctx.body
        //console.log(ctx);
        if (!data.quantity || data.quantity <= 0) {
            return Promise.reject({ statusCode: 400, message: 'Field quantity should be >0.' });
        }
        const userId = getCurrentUserId(ctx);
        Product.findById(id).then(product => {
            if (!product) {

                return Promise.reject({ statusCode: 404, message: 'Product Not Found.' });
            }            
            if (product.inStock < data.quantity) {
                return Promise.reject({ statusCode: 400, message: 'Not enough product in stock.' });
            }
            console.log(`buy poduct id: ${id}  by user:${userId}`, data);
            product.inStock -= data.quantity;
            product.purchaseHistories.create({
                productId: product.id,
                personId: userId,
                quantity: data.quantity,
                unitCost: product.cost,
                inserted: new Date()
            });
            return product.save();
        }).then((product) => {
            cb(null, product);

        }).catch(error => {
            cb(error, null);
        });
    }
    Product.setStock = function (ctx, options, data, id, cb) {
        const userId = getCurrentUserId(ctx);
        Product.findById(id)
            .then((product) => {
                if (!product) {

                    return Promise.reject({ statusCode: 404, message: 'Product Not Found' });
                }
                if (!data.stock || data.stock < 0) {
                    return Promise.reject({ statusCode: 400, message: 'Property stock should be >=0.' });
                }
                product.inStock = data.stock;
                return product.save();
            }).then((product) => {
                cb(null, product);

            }).catch(error => {
                cb(error, null);
            });
    };
    Product.setPrice = function (ctx, options, data, id, cb) {
        const userId = getCurrentUserId(ctx);
        Product.findById(id)
            .then((product) => {
                if (!product) {

                    return Promise.reject({ statusCode: 404, message: 'Product Not Found.' });
                }
                if (!data.price || data.price < 0) {
                    return Promise.reject({ statusCode: 400, message: 'Property price should be >=0.' });
                }
                product.cost = data.price;
                return product.save();
            }).then((product) => {
                cb(null, product);

            }).catch(error => {
                cb(error, null);
            });
    };

    Product.like = function (ctx, options, data, id, cb) {
        // request/ response ctx.req/ ctx.res
        //request body ctx.body
        //console.log(ctx);
        const userId = getCurrentUserId(ctx);
        var objectId = Product.getDataSource().connector.getDefaultIdType();

        //Product.find({ id: id }, { likes: objectId(userId) })
        Product.findById(id)
            .then((product) => {
                if (!product) {

                    return Promise.reject({ statusCode: 404, message: 'Product Not Found' });
                }
                console.log(`like poduct id: ${id}  by user:${userId}`, data);
                return product.likes({ where: { personId: userId } })
                    .then((likes) => {

                        if (likes.length > 0) {
                            //like found
                            return product;
                        } else {
                            return product.likes
                                .create({
                                    personId: userId,
                                    productId: product.id,
                                    date: new Date()
                                }).then((data) => {
                                    product.likeCount += 1;
                                    return product.save();
                                });
                        }

                    })

            })
            .then((likes) => {
                return Product.findById(id);


            }).then((product) => {

                cb(null, product);
            }).catch(error => {
                cb(error, null);
            });
    }

    Product.dislike = function (ctx, options, data, id, cb) {
        const userId = getCurrentUserId(ctx);
        var objectId = Product.getDataSource().connector.getDefaultIdType();

        //Product.find({ id: id }, { likes: objectId(userId) })
        Product.findById(id)
            .then((product) => {
                if (!product) {
                    //product not found
                    return Promise.reject({ statusCode: 404, message: 'Product Not Found' });
                }
                console.log(`like poduct id: ${id}  by user:${userId}`, data);
                return product.likes({ where: { personId: userId } })
                    .then((likes) => {

                        if (likes.length > 0) {
                            //like found

                            return product.likes.destroy(likes[0].id)
                                .then((data) => {
                                    product.likeCount -= 1;
                                    return product.save();
                                });

                        } else {
                            return product;
                        }
                    })

            })
            .then((data) => {
                return Product.findById(id);

            }).then((product) => {
                cb(null, product);
            }).catch(error => {
                cb(error, null);
            });
    }


    Product.remoteMethod('buy', {
        http: { path: '/:id/buy', verb: 'put' },
        accepts: [
            { arg: 'ctx', type: 'object', 'http': { source: 'context' } },
            { "arg": "options", "type": "object", "http": "optionsFromRequest" },
            { arg: 'data', type: 'object', http: { source: 'body' } },
            { arg: 'id', type: 'string', required: true }
        ],
        returns: { arg: 'product', type: 'object' }
    });
    Product.remoteMethod('setStock', {
        http: { path: '/:id/stock', verb: 'patch' },
        accepts: [
            { arg: 'ctx', type: 'object', 'http': { source: 'context' } },
            { "arg": "options", "type": "object", "http": "optionsFromRequest" },
            { arg: 'data', type: 'object', http: { source: 'body' } },
            { arg: 'id', type: 'string', required: true }
        ],
        returns: { arg: 'product', type: 'object' }
    });
    Product.remoteMethod('setPrice', {
        http: { path: '/:id/price', verb: 'patch' },
        accepts: [
            { arg: 'ctx', type: 'object', 'http': { source: 'context' } },
            { "arg": "options", "type": "object", "http": "optionsFromRequest" },
            { arg: 'data', type: 'object', http: { source: 'body' } },
            { arg: 'id', type: 'string', required: true }
        ],
        returns: { arg: 'product', type: 'object' }
    });

    Product.remoteMethod('like', {
        http: { path: '/:id/like', verb: 'put' },
        accepts: [
            { arg: 'ctx', type: 'object', 'http': { source: 'context' } },
            { "arg": "options", "type": "object", "http": "optionsFromRequest" },
            { arg: 'data', type: 'object', http: { source: 'body' } },
            { arg: 'id', type: 'string', required: true }
        ],
        returns: { arg: 'product', type: 'object' }
    });

    Product.remoteMethod('dislike', {
        http: { path: '/:id/like', verb: 'delete' },
        accepts: [
            { arg: 'ctx', type: 'object', 'http': { source: 'context' } },
            { "arg": "options", "type": "object", "http": "optionsFromRequest" },
            { arg: 'data', type: 'object', http: { source: 'body' } },
            { arg: 'id', type: 'string', required: true }
        ],
        returns: { arg: 'product', type: 'object' }
    });
};
