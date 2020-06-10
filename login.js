const { interval } = require('rxjs');
const log4js = require('log4js');
const _ = require('lodash');

const CRUD = require('./crud');
const httpClient = require('./lib/http.utils');

let logger;
if (global.logger) {
    logger = global.logger;
} else {
    logger = log4js.getLogger('odp-apis');
    logger.level = process.env.LOG_LEVEL || 'info';
}

/**
 * 
 * @typedef {Object} Options
 * @property {string} host - The hostname/FQDN of the application to connect
 * @property {string} username - Username of Bot
 * @property {string} password - Password of Bot
 */




/**
 * 
 * @param {Options} options 
 */
function ODPApis(options) {
    if (!options) {
        throw new Error('Options is mandatory');
    }
    if (!options.host) {
        throw new Error('Host is mandatory');
    }
    if (!options.username) {
        throw new Error('Username is mandatory');
    }
    if (!options.password) {
        throw new Error('Password is mandatory');
    }
    if (!options.host.endsWith('/')) {
        options.host += '/';
    }
    this.host = options.host;
    this.username = options.username;
    this.password = options.password;
    this.loginData = {};
}


ODPApis.prototype.login = async function () {
    const username = this.username;
    const password = this.password;
    let refreshRoutine;
    let hbRoutine;
    try {
        let res = await httpClient.post(this.host + 'api/a/rbac/login', {
            body: { username, password }
        });
        if (res.statusCode === 200) {
            _.merge(this.loginData, res.body);
            if (this.loginData.rbacUserToSingleSession || this.loginData.rbacUserCloseWindowToLogout) {
                logger.debug('Creating HB Routine');
                const intervalValue = (this.loginData.rbacHbInterval * 1000) - 1000;
                hbRoutine = interval(intervalValue).subscribe(async () => {
                    logger.debug('[HB Triggred]', this.loginData.token, this.loginData.uuid);
                    try {
                        let res = await httpClient.put(this.host + 'api/a/rbac/usr/hb', {
                            headers: {
                                Authorization: 'JWT ' + this.loginData.token
                            },
                            body: {
                                uuid: this.loginData.uuid
                            }
                        });
                        if (res.statusCode === 200) {
                            _.merge(this.loginData, res.body);
                        } else if (res.statusCode === 401) {
                            this.login();
                            if (hbRoutine) {
                                hbRoutine.unsubscribe();
                            }
                        } else {
                            logger.error(res.body);
                        }
                    } catch (e) {
                        logger.error(e);
                    }
                });
            }
            if (this.loginData.rbacUserTokenRefresh) {
                logger.debug('Creating Refresh Routine');
                let intervalValue = (this.loginData.rbacUserTokenDuration - (5 * 60)) * 1000;
                if (this.loginData.bot) {
                    intervalValue = (this.loginData.rbacBotTokenDuration - (5 * 60)) * 1000;
                }
                refreshRoutine = interval(intervalValue).subscribe(async () => {
                    logger.debug('[Refresh Triggred]', this.loginData.token, this.loginData.rToken);
                    try {
                        let res = await httpClient.get(this.host + 'api/a/rbac/refresh', {
                            headers: {
                                rToken: 'JWT ' + this.loginData.rToken,
                                Authorization: 'JWT ' + this.loginData.token
                            }
                        });
                        if (res.statusCode === 200) {
                            _.merge(this.loginData, res.body);
                        } else if (res.statusCode === 401) {
                            this.login();
                            if (refreshRoutine) {
                                refreshRoutine.unsubscribe();
                            }
                        } else {
                            logger.error(res.body);
                        }
                    } catch (e) {
                        logger.error(e);
                    }
                });
            }
            return res.body;
        } else {
            throw res.body;
        }
    } catch (e) {
        throw e;
    }
};

/**
 * @param {string} api The API Endpoint
 */
ODPApis.prototype.crud = function (api) {
    const temp = new CRUD(api);
    temp.loginData = this.loginData;
    temp.host = this.host;
    return temp;
};

module.exports = ODPApis;