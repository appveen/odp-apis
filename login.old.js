const { Observable, timer, interval } = require('rxjs');
const { flatMap } = require('rxjs/operators');
const log4js = require('log4js');
const _ = require('lodash');

const httpClient = require('./lib/http-client.utils');

let logger;
if (global.logger) {
    logger = global.logger;
} else {
    logger = log4js.getLogger('odp-apis');
    logger.level = process.env.LOG_LEVEL || 'debug';
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
* @typedef {Object} UserData
* @property {string} token
* @property {string} _id
* @property {string} username
* @property {string} basicDetails.name
* @property {string} basicDetails.phone
* @property {string} basicDetails.email
* @property {boolean} isSuperAdmin
* @property {boolean} bot
* @property {number} sessionTime
* @property {number} serverTime
* @property {number} expiresIn
* @property {string} lastLogin
*/


/**
 * 
 * @param {Options} options 
 * @returns {Promise<UserData>}
 */
async function login(options) {
    if (!options.host.endsWith('/')) {
        options.host += '/';
    }
    const loginUrl = options.host + 'api/a/rbac/login';
    const refreshUrl = options.host + 'api/a/rbac/refresh';
    const heartBeatUrl = options.host + 'api/a/rbac/usr/hb';
    const loginData = {};
    let refreshRoutine;
    let hbRoutine;
    await doLogin();
    return loginData;
    async function doLogin() {
        const username = options.username;
        const password = options.password;
        let res = await httpClient.post(loginUrl, {
            body: { username, password }
        });
        if (res.statusCode === 200) {
            _.merge(loginData, res.body);
            if (loginData.rbacUserToSingleSession || loginData.rbacUserCloseWindowToLogout) {
                logger.debug('Creating HB Routine');
                createHeartBeatRoutine();
            }
            if (loginData.rbacUserTokenRefresh) {
                logger.debug('Creating Refresh Routine');
                createAutoRefreshRoutine();
            }
            return res.body;
        } else {
            throw res.body;
        }
    }

    function createAutoRefreshRoutine() {
        const resolveIn = loginData.expiresIn - new Date(loginData.serverTime).getTime() - 300000;
        let intervalValue = (loginData.rbacUserTokenDuration - (5 * 60)) * 1000;
        if (loginData.bot) {
            intervalValue = (loginData.rbacBotTokenDuration - (5 * 60)) * 1000;
        }
        if (refreshRoutine) {
            refreshRoutine.unsubscribe();
        }
        timer(resolveIn).pipe(
            flatMap(e => doRefresh())
        ).subscribe((res1) => {
            _.merge(loginData, res1);
            refreshRoutine = interval(intervalValue).pipe(
                flatMap(e => doRefresh())
            ).subscribe((res2) => {
                _.merge(loginData, res2);
            }, logger.error);
        }, logger.error);
    }
    function createHeartBeatRoutine() {
        const resolveIn = (loginData.rbacHbInterval * 1000) - 1000;
        if (hbRoutine) {
            hbRoutine.unsubscribe();
        }
        doHeartbeat().subscribe(data => {
            hbRoutine = interval(resolveIn).pipe(
                flatMap(e => doHeartbeat())
            ).subscribe((res2) => { }, logger.error);
        }, logger.error);

    }
    function doRefresh() {
        return new Observable(async (observe) => {
            logger.debug('[Refresh Triggred]', loginData.token, loginData.rToken);
            let res = await httpClient.get(refreshUrl, {
                headers: {
                    rToken: loginData.rToken,
                    Authorization: 'JWT ' + loginData.token
                }
            });
            if (res.statusCode === 200) {
                _.merge(loginData, res.body);
                observe.next(res.body);
            } else if (res.statusCode === 401) {
                doLogin();
            } else {
                observe.error(res.body);
            }
            observe.complete();
        });
    }
    function doHeartbeat() {
        return new Observable(async (observe) => {
            logger.debug('[HB Triggred]', loginData.token, loginData.uuid);
            let res = await httpClient.put(heartBeatUrl, {
                headers: {
                    Authorization: 'JWT ' + loginData.token
                },
                body: {
                    uuid: loginData.uuid
                }
            });
            if (res.statusCode === 200) {
                _.merge(loginData, res.body);
                observe.next(res.body);
            } else if (res.statusCode === 401) {
                doLogin();
            } else {
                observe.error(res.body);
            }
            observe.complete();
        });
    }
}


module.exports = login;