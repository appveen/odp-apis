const fs = require('fs');
const path = require('path');
const { Observable, timer, interval } = require('rxjs');
const { flatMap } = require('rxjs/operators');

const httpClient = require('./lib/http-client.utils');
const odpClient = require('./lib/odp-client.utils');

const TOKEN_PATH = path.join(process.cwd(), 'TOKEN');
if (!fs.existsSync(TOKEN_PATH)) {
    fs.writeFileSync(TOKEN_PATH, '', 'utf8');
}
let loginData = {};
let loginIntval;

/**
 * 
 * @typedef {Object} Options
 * @property {string} host - The hostname/FQDN of the application to connect
 * @property {string} username - Username of Bot
 * @property {string} password - Password of Bot
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




function createAutoRefreshRoutine(options, userDetails) {
    const resolveIn = userDetails.expiresIn - new Date(userDetails.serverTime).getTime() - 300000;
    let intervalValue = (userDetails.rbacUserTokenDuration - (5 * 60)) * 1000;
    if (userDetails.bot) {
        intervalValue = (userDetails.rbacBotTokenDuration - (5 * 60)) * 1000;
    }
    loginIntval = timer(resolveIn).pipe(
        flatMap(e => doLogin(options))
    ).subscribe((res1) => {
        Object.assign(loginData, res1);
        loginIntval = interval(intervalValue).pipe(
            flatMap(e => doLogin(options))
        ).subscribe((res2) => {
            Object.assign(loginData, res2);
        }, console.error);
    }, console.error);
}

async function getToken() {
    return fs.readFileSync(TOKEN_PATH);
}

/**
 * 
 * @param {Options} options
 * @param {boolean} init If it is an initialize call
 */
function doLogin(options, init) {
    return new Observable(observe => {
        const host = options.host;
        const username = options.username;
        const password = options.password;
        let res = await httpClient.post(host + '/api/a/rbac/login', {
            body: { username, password }
        });
        if (res.statusCode === 200) {
            fs.writeFileSync(TOKEN_PATH, res.body.token, 'utf8');
            Object.assign(loginData, res.body);
            observe.next(res.body);
            if (init) {
                createAutoRefreshRoutine(options, res.body);
            }
        } else {
            Object.assign(loginData, {});
            observe.next(null);
        }
        observe.complete();
    });
}


/**
 * 
 * @param {Options} AppOptions
 */
function app(options) {
    /**
     * @param {string} app The App Name
     */
    return (app) => {
        const host = options.host;
        const temp = JSON.parse(JSON.stringify(options));
        temp.app = app;
        return {
            get: (select) => {
                async function execute() {
                    const query = {};
                    if (select) {
                        query.select = select;
                    }
                    const token = await getToken();
                    const res = await httpClient.get(host + '/api/a/rbac/app/' + app, {
                        qs: query,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'JWT ' + token
                        },
                    });
                    return {
                        statusCode: res.statusCode,
                        body: res.body
                    };
                }
                return execute();
            },
            dataService: dataService(temp)
        }
    };
}

/**
 * 
 * @param {Options} options
 */
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
                    query.count = 2;
                    query.filter = JSON.stringify({ $and: [{ app: options.app }, { $or: [{ _id: serviceId }, { name: serviceId }] }] });
                    const token = await getToken();
                    const res = await httpClient.get(host + '/api/a/sm/service', {
                        qs: query,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'JWT ' + token
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
                    const token = await getToken();
                    const res = await httpClient.post(host + '/api/a/sm/service/' + serviceId, {
                        qs: query,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'JWT ' + token
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

/**
 * 
 * @param {Options} options
 */
function init(options) {
    doLogin(options, true).subscribe(res => { console.log('**** Login Done ****') });
    return {
        getToken: getToken,
        loginData: loginData,
        app: app(options)
    };
}

module.exports = init;