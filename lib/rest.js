'use strict';

const mongoose = require('mongoose');
const lodash = require('lodash');
const libv = require('./validation');
const libqs = require('./querystring');


class REST {
    constructor(model) {
        this.model = typeof model === 'string'? mongoose.model(model): model;
    }

    isFunction(fn) {
        return typeof fn === 'function';
    }

    async size(ctx) {
        let qs = libqs.getDateRange(libqs.getQueryString(ctx));
        return await this.model.count(qs);
    }

    async list(ctx, handlers) {
        handlers = handlers || {
            default_qs: null,
        };
        let default_qs = handlers.default_qs || 'CreationDate';
        try {
            let qs = libqs.getDateRange(libqs.getQueryString(ctx));
            qs = (handlers.qs)? lodash.merge(qs, handlers.qs): qs;
            let { skip, limit } = libqs.getPagination(qs);
            let sort = libqs.getSortingOption(qs, default_qs);
            let select = handlers.select? handlers.select: '' ;
            let doc = await this.model.find(qs).select(select).sort(sort).skip(skip).limit(limit);
            if (handlers.postQuery && this.isFunction(handlers.postQuery)) {
                doc = await handlers.postQuery(doc);
            }
            ctx.status = 200;
            return { qs, sort, skip, limit, doc };
        } catch(error) {
            ctx.throw(400, error);
        }
    }

    async create(ctx, handlers) {
        handlers = handlers || {
            preCreate: null,
            postCreate: null,
        };
        try {
            let qs = libqs.getQueryString(ctx);
            let body = ctx.request.body;
            if (Array.isArray(body)) {
                let doc = [];
                for (let each of body) {
                    let newEach = lodash.cloneDeep(each);
                    if (handlers.preCreate && this.isFunction(handlers.preCreate)) {
                        newEach = await handlers.preCreate(ctx, each);
                    }
                    let created = await this.model.create(newEach);
                    if (!created) ctx.throw(400);
                    if (handlers.postCreate && this.isFunction(handlers.postCreate)) {
                        created = await handlers.postCreate(ctx, created);
                    }
                    doc.push(created);
                }
                if (!doc.length) ctx.throw(400);
                ctx.status = 201;
                return { qs, body, doc };
            } else {
                let newBody = lodash.cloneDeep(body);
                if (this.isFunction(handlers.preCreate)) {
                    newBody = await handlers.preCreate(ctx, body);
                }
                let doc = await this.model.create(newBody);
                if (!doc) ctx.throw(400);
                doc = doc.toObject();
                if (this.isFunction(handlers.postCreate)) {
                    doc = await handlers.postCreate(ctx, doc);
                }
                ctx.status = 201;
                return { qs, body, doc };
            }
        } catch(error) {
            ctx.throw(400, error);
        }
    }

    async read(ctx, handlers) {
        handlers = handlers || {
            postQuery: null,
        };
        try {
            let id = libv.getValidId(ctx);
            let qs = libqs.getQueryString(ctx);
            let doc = await this.model.findById(id);
            if (!doc) ctx.throw(404);
            doc = doc.toObject();
            if (this.isFunction(handlers.postQuery)) {
                doc = await handlers.postQuery(doc);
            }
            ctx.status = 200;
            return { qs, doc };
        } catch(error) {
            ctx.throw(400, error);
        }
    }

    async update(ctx, handlers) {
        handlers = handlers || {
            creation_date_key: null,
            last_modified_key: null,
        };
        let creation_date_key = handlers.creation_date_key || 'CreationDate';
        let last_modified_key = handlers.last_modified_key || 'LastModified';
        try {
            let id = libv.getValidId(ctx);
            let qs = libqs.getQueryString(ctx);
            let body = ctx.request.body;
            let oldDoc = await this.model.findById(id._id);
            let newDoc = lodash.cloneDeep(body);
            if (newDoc._id && (oldDoc._id !== body._id)) {
                ctx.throw(400, 'Invalid id filed');
            }
            if (newDoc[creation_date_key]) {
                newDoc[creation_date_key] = oldDoc[creation_date_key];
            }
            newDoc[last_modified_key] = new Date();
            let option = { new: true };
            if (handlers.preCreate && this.isFunction(handlers.preCreate)) {
                newDoc = await handlers.preCreate(ctx, newDoc);
            }
            let savedDoc = await this.model.findByIdAndUpdate(id, newDoc, option);
            if (!savedDoc) ctx.throw(404);
            savedDoc = savedDoc.toObject();
            if (handlers.postCreate && this.isFunction(handlers.postCreate)) {
                savedDoc = await handlers.postCreate(ctx, savedDoc);
            }
            ctx.status = 200;
            return { qs, body: ctx.request.body, doc: savedDoc };
        } catch(error) {
            ctx.throw(400, error);
        }
    }

    async remove(ctx, handlers) {
        handlers = handlers || {
            postDelete: null,
        };
        try {
            let id = libv.getValidId(ctx);
            let qs = libqs.getQueryString(ctx);
            let doc = await this.model.findByIdAndRemove(id);
            if (!doc) ctx.throw(404);
            doc = doc.toObject();
            if (this.isFunction(handlers.postDelete)) {
                doc = await handlers.postDelete(doc);
            }
            ctx.status = 200;
            return { qs, doc };
        } catch(error) {
            ctx.throw(400, error);
        }
    }

    restapi() {
        return {
            list: this.list,
            create: this.create,
            read: this.read,
            update: this.update,
            remove: this.remove,
        };
    }
}


module.exports = REST;
