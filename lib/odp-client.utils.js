const fs = require('fs');
const path = require('path');
const log4js = require('log4js');
const httpClient = require('./http-client.utils');

const TOKEN_PATH = path.join(process.cwd(), 'TOKEN');
if (!fs.existsSync(TOKEN_PATH)) {
    fs.writeFileSync(TOKEN_PATH, '', 'utf8');
}

const logger = log4js.getLogger('odp-client.utils');

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
* @typedef {Object} GetAPIOptions
* @property {string} documentId - The Document ID to fetch Document
* @property {string} select - To Project fewer fields
*/

/**
 * 
 * @typedef {Object} Options
 * @property {string} host - The hostname/FQDN of the application to connect
 * @property {string} username - Username of Bot
 * @property {string} password - Password of Bot
 * @property {string} app - The App Name
 * @property {string} serviceId - The Service ID/Name
 */

/**
 * 
 * @param {Options} options
 */
function getToken(options) {
    async function execute() {
        const host = options.host;
        const username = options.username;
        const password = options.password;
        let res;
        const TOKEN = fs.readFileSync(TOKEN_PATH);
        if (TOKEN) {
            res = await httpClient.get(host + '/api/a/rbac/check', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'JWT ' + TOKEN
                }
            });
            if (res.statusCode === 200) {
                fs.writeFileSync(TOKEN_PATH, res.body.token, 'utf8');
                return res.body.token;
            } else {
                res = await httpClient.post(host + '/api/a/rbac/login', {
                    body: { username, password }
                });
            }
        } else {
            res = await httpClient.post(host + '/api/a/rbac/login', {
                body: { username, password }
            });
        }
        if (res.statusCode === 200) {
            fs.writeFileSync(TOKEN_PATH, res.body.token, 'utf8');
            return res.body.token;
        } else {
            logger.debug('Login Failed!', res.statusCode, res.body);
            return null;
        }
    }
    return execute();
}

/**
 * 
 * @param {Options} options
 */
function getServiceAPI(options) {
    async function execute() {
        const TOKEN = fs.readFileSync(TOKEN_PATH);
        const query = {};
        query.select = '_id,api,app';
        query.filter = JSON.stringify({ $and: [{ app: options.app }, { $or: [{ _id: options.serviceId }, { name: options.serviceId }] }] });
        query.count = 2;
        const res = await httpClient.get(options.host + '/api/a/sm/service', {
            qs: query,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'JWT ' + TOKEN
            }
        });
        if (res.statusCode === 200 && Array.isArray(res.body) && res.body.length > 0) {
            return '/api/c/' + res.body[0].app + res.body[0].api;
        }
        logger.debug('Service Not Found!', res.statusCode, res.body);
        return null;
    }
    return execute();
}

/**
 * 
 * @param {Options} options 
 */
function get(options) {
    /**
     * @param {GetAPIOptions} getOptions
     */
    return function (getOptions) {
        async function execute() {
            const query = {};
            if (getOptions.select) {
                query.select = getOptions.select
            }
            const token = await getToken(options);
            const api = await getServiceAPI(options);
            const res = await httpClient.get(options.host + api + '/' + getOptions.documentId, {
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
        }
        return execute();
    }
}

/**
 * 
 * @param {Options} options 
 */
function count(options) {
    /**
     * @param {string} filter
     */
    return function (filter) {
        async function execute() {
            const query = {};
            if (filter) {
                query.filter = JSON.stringify(filter);
            }
            const token = await getToken(options);
            const api = await getServiceAPI(options);
            const res = await httpClient.get(options.host + api + '/count', {
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
        }
        return execute();
    }
}

/**
 * 
 * @param {Options} options 
 */
function list(options) {
    /**
     * @param {ListAPIOptions} listOptions
     */
    return function (listOptions) {
        async function execute() {
            const query = {};
            if (listOptions.select) {
                query.select = listOptions.select
            }
            if (listOptions.count) {
                query.count = listOptions.count
            }
            if (listOptions.page) {
                query.page = listOptions.page
            }
            if (listOptions.sort) {
                query.sort = listOptions.sort
            }
            if (listOptions.filter) {
                query.filter = JSON.stringify(listOptions.filter)
            }
            const token = await getToken(options);
            const api = await getServiceAPI(options);
            const res = await httpClient.get(options.host + api, {
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
        }
        return execute();
    }
}

/**
 * 
 * @param {Options} options 
 */
function create(options) {
    /**
     * @param {Object} body The data to be saved in DB
     */
    return function (body) {
        async function execute() {
            const token = await getToken(options);
            const api = await getServiceAPI(options);
            const res = await httpClient.post(options.host + api, {
                body: body,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'JWT ' + token
                }
            });
            return {
                statusCode: res.statusCode,
                body: res.body
            };
        }
        return execute();
    }
}

/**
 * 
 * @param {Options} options 
 */
function update(options) {
    /**
     * @param {string} documentId ID of the Document that needs to be updated
     * @param {Object} body The data to be updated
     */
    return function (documentId, body) {
        async function execute() {
            const token = await getToken(options);
            const api = await getServiceAPI(options);
            const res = await httpClient.put(options.host + api + '/' + documentId, {
                body: body,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'JWT ' + token
                }
            });
            return {
                statusCode: res.statusCode,
                body: res.body
            };
        }
        return execute();
    }
}

/**
 * 
 * @param {Options} options 
 */
function remove(options) {
    /**
     * @param {string} documentId ID of the Document that needs to be removed
     */
    return function (documentId) {
        async function execute() {
            const token = await getToken(options);
            const api = await getServiceAPI(options);
            const res = await httpClient.delete(options.host + api + '/' + documentId, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'JWT ' + token
                }
            });
            return {
                statusCode: res.statusCode,
                body: res.body
            };
        }
        return execute();
    }
}


module.exports = {
    get,
    list,
    count,
    create,
    update,
    remove
};