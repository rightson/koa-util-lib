'use strict';

module.exports = {
    getPagination,
    getSortingOption,
    getDateRange,
};

function getPagination(qs, skip=0, limit=100) {
    if (qs.hasOwnProperty('skip')) {
        skip = parseInt(qs.skip);
        delete qs.skip;
    }
    if (qs.hasOwnProperty('limit')) {
        limit = parseInt(qs.limit);
        delete qs.limit;
    }
    return { skip, limit };
}

function getSortingOption(qs, key='CreationDate', order=1) {
    if (qs.hasOwnProperty('sortby')) {
        key = qs.sortby;
        delete qs.sortby;
    }
    if (qs.hasOwnProperty('order')) {
        order = qs.order;
        delete qs.order;
    }
    let option = {};
    option[key] = order;
    return option;
}

function getDateRange(obj) {
    for (let key in obj) {
        let greater = key.match(/^(\w+)_(Start)$/);
        let less = key.match(/^(\w+)_(End)$/);
        if (greater) {
            if (!obj[greater[1]]) obj[greater[1]] = {};
            obj[greater[1]]['$gte'] = obj[greater[0]];
            delete obj[greater[0]];
        } else if (less) {
            if (!obj[less[1]]) obj[less[1]] = {};
            obj[less[1]]['$lt'] = obj[less[0]];
            delete obj[less[0]];
        }
    }
    return obj;
}

