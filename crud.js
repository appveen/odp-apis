const httpClient = require('./lib/http.utils');

/**
 * 
 * @typedef {Object} Options
 * @property {string} path - The API Endpoint
 * @property {*} loginData - The login data from Login()
 */


/**
* 
* @typedef {Object} ListAPIOptions
* @property {number} count - The no of documents in a page [Default:10] [-1 for All]
* @property {number} page - Pagination no, Doesn't work if count is -1
* @property {string} select - To Project fewer fields
* @property {string} sort - To sort records based on keys
* @property {Object} filter - To filter records based on mongodb filter
*/


/**
 * 
 * @param {string} api The API Endpoint 
 */
function CRUD(api) {
    this.api = api;
}

// CRUD.prototype.count = _count;
// CRUD.prototype.get = _get;
// CRUD.prototype.list = _list;
// CRUD.prototype.post = _post;
// CRUD.prototype.put = _put;
// CRUD.prototype.delete = _delete;


/**
 * 
 * @param {object} filter The mongo filter
 */
CRUD.prototype.count = async function (filter) {
    try {
        const query = {};
        if (filter) {
            query.filter = JSON.stringify(filter);
        }
        const token = this.loginData.token;
        const res = await httpClient.get(this.host + this.api + '/count', {
            qs: query,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'JWT ' + token
            }
        });
        return {
            statusCode: res.statusCode,
            body: res.body
        };
    } catch (e) {
        throw e;
    }
}

/**
 * 
 * @param {string} id The Document ID
 * @param {string} [select] To Select fewer fields
 */
CRUD.prototype.get = async function (id, select) {
    try {
        const query = {};
        if (select) {
            query.select = select
        }
        const token = this.loginData.token;
        const res = await httpClient.get(this.host + this.api + '/' + id, {
            qs: query,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'JWT ' + token
            }
        });
        return {
            statusCode: res.statusCode,
            body: res.body
        };
    } catch (e) {
        throw e;
    }
}


/**
 * 
 * @param {ListAPIOptions} options The List API Options
 */
CRUD.prototype.list = async function (options) {
    try {
        const query = {};
        if (options.select) {
            query.select = options.select;
        }
        if (options.sort) {
            query.sort = options.sort;
        }
        if (options.count) {
            query.count = options.count;
        }
        if (options.page) {
            query.page = options.page;
        }
        if (options.filter) {
            query.filter = JSON.stringify(options.filter);
        }
        const token = this.loginData.token;
        const res = await httpClient.get(this.host + this.api, {
            qs: query,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'JWT ' + token
            }
        });
        return {
            statusCode: res.statusCode,
            body: res.body
        };
    } catch (e) {
        throw e;
    }
}

/**
 * 
 * @param {object} data The data to be created as Document
 */
CRUD.prototype.post = async function (data) {
    try {
        const token = this.loginData.token;
        const res = await httpClient.post(this.host + this.api, {
            body: data,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'JWT ' + token
            }
        });
        return {
            statusCode: res.statusCode,
            body: res.body
        };
    } catch (e) {
        throw e;
    }
}


/**
 * 
 * @param {string} id The Document ID to Update
 * @param {object} data To data to update
 */
CRUD.prototype.put = async function (id, data) {
    try {
        const token = this.loginData.token;
        const res = await httpClient.put(this.host + this.api + '/' + id, {
            body: data,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'JWT ' + token
            }
        });
        return {
            statusCode: res.statusCode,
            body: res.body
        };
    } catch (e) {
        throw e;
    }
}


/**
 * 
 * @param {string} id The Document ID to Delete
 */
CRUD.prototype.delete = async function (id) {
    try {
        const token = this.loginData.token;
        const res = await httpClient.delete(this.host + this.api + '/' + id, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'JWT ' + token
            }
        });
        return {
            statusCode: res.statusCode,
            body: res.body
        };
    } catch (e) {
        throw e;
    }
}


module.exports = CRUD;