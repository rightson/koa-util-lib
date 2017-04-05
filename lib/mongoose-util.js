'use strict';

const mongoose = require('mongoose');

module.exports = {
    getValidId,
    caseInsensitive,
};

const isValid = mongoose.Types.ObjectId.isValid;

function getValidId(id) {
    if (!isValid(id)) {
        throw `Invalid ID '${id}'`;
    }
    return id;
}

function caseInsensitive(pattern) {
    return { '$regex': new RegExp('^' + pattern.toLowerCase(), 'i') };
}

