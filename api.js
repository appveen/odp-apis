const httpClient = require('./lib/http-client.utils');
const odpClient = require('./lib/odp-client.utils');

/**
 * 
 * @typedef {Object} Options
 * @property {string} host - The hostname/FQDN of the application to connect
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
* @typedef {Object} GetAPIOptions
* @property {string} select - To Project fewer fields
*/

/**
* 
* @typedef {Options} AppOptions
* @property {string} app - The App Name
*/

/**
* 
* @typedef {AppOptions} DocumentOptions
* @property {string} serviceId - The Data Service ID/Name
*/

/**
 * 
 * @param {Options} options 
 */
function api(options) {
    function getToken() {
        return options.loginData.token;
    }
    return {
        app: (app) => {
            const host = options.host;
            const temp = JSON.parse(JSON.stringify(options));
            temp.app = app;
            return {
                get: async (select) => {
                    const query = {};
                    if (select) {
                        query.select = select;
                    }
                    const res = await httpClient.get(host + '/api/a/rbac/app/' + app, {
                        qs: query,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'JWT ' + getToken()
                        },
                    });
                    return {
                        statusCode: res.statusCode,
                        body: res.body
                    };
                },
                dataService: dataService(temp)
            }
        }
    };

}


function dataService(options) {
    /**
     * @param {string} serviceId The Data Service Id/Name
     */
    return (serviceId) => {
        const host = options.host;
        const temp = JSON.parse(JSON.stringify(options));
        temp.serviceId = serviceId;
        return {
            get: (select) => {
                async function execute() {
                    const query = {};
                    if (select) {
                        query.select = select;
                    }
                    query.count = 1;
                    query.filter = JSON.stringify({ $and: [{ app: options.app }, { $or: [{ _id: serviceId }, { name: serviceId }] }] });
                    const res = await httpClient.get(host + '/api/a/sm/service', {
                        qs: query,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'JWT ' + getToken()
                        },
                    });
                    return {
                        statusCode: res.statusCode,
                        body: res.body[0]
                    };
                }
                return execute();
            },
            api: () => {
                async function execute() {
                    const query = {};
                    if (select) {
                        query.select = select;
                    }
                    const res = await httpClient.post(host + '/api/a/sm/service/' + serviceId, {
                        qs: query,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'JWT ' + getToken()
                        },
                    });
                    return {
                        statusCode: res.statusCode,
                        body: res.body
                    };
                }
                return execute();
            },
            documents: documents(temp)
        }
    };
}


/**
 * 
 * @param {DocumentOptions} options
 */
function documents(options) {
    const temp = JSON.parse(JSON.stringify(options));
    return () => {
        return {
            count: odpClient.count(temp),
            create: odpClient.create(temp),
            get: odpClient.get(temp),
            list: odpClient.list(temp),
            remove: odpClient.remove(temp),
            update: odpClient.update(temp)
        };
    }
}

module.exports = api;