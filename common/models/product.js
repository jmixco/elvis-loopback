﻿'use strict';
var app = require('../../server/server');
var loopback = require('loopback');

module.exports = function (Product) {
    function getCurrentUserId(ctx) {

        var accessToken = ctx.req.accessToken;//options && options.accessToken;
        var userId = accessToken && accessToken.userId;
        return userId;
    }
    //Location.disableRemoteMethodByName('prototype.updateAttributes');
    Product.buy = function (ctx, options, data, id, cb) {
        // request/ response ctx.req/ ctx.res
        //request body ctx.body
        //console.log(ctx);
        const userId = getCurrentUserId(ctx);
        Product.findById(id).then(product => {
            if (!product) {

                return Promise.reject({ statusCode: 404, message: 'Product Not Found' });
            }
            console.log(`buy poduct id: ${id}  by user:${userId}`, data);
            product.inStock -= data.quantity;
            product.purchaseHistories.create({
                productId: product.id,
                personId: userId,
                quantity: data.quantity,
                unitCost: product.cost,
                inserted: new Date()
            })
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
                if (!data.stock||data.stock<0) {
                    return Promise.reject({ statusCode: 400, message: 'property stock should be >=0' });
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

                    return Promise.reject({ statusCode: 404, message: 'Product Not Found' });
                }
                if (!data.price || data.price < 0) {
                    return Promise.reject({ statusCode: 400, message: 'property price should be >=0' });
                }
                product.price = data.price;
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
                return product.likes({ personId: userId }).then((people) => {

                    if (people.length > 0) {
                        //like found
                        return product.likes;
                    } else {
                        return product.likes.create({
                            personId: userId,
                            productId: product.id,
                            date: new Date()
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
                return product.likes({ personId: userId })
                    .then((likes) => {

                        if (likes.length > 0) {
                            //like found
                            likes.forEach((l, index, arr) => {
                                product.likes.destroy(l.id, (error) => {
                                    if (error) {
                                        console.log(error);
                                    }
                                });
                            });
                            return product.save();
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