const { Observable, timer, interval } = require('rxjs');
const { flatMap } = require('rxjs/operators');

const httpClient = require('./lib/http-client.utils');

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
    const username = options.username;
    const password = options.password;
    let res = await httpClient.post(loginUrl, {
        body: { username, password }
    });
    if (res.statusCode === 200) {
        Object.assign(loginData, res.body);
        if (loginData.rbacUserToSingleSession || loginData.rbacUserCloseWindowToLogout) {
            createHeartBeatRoutine();
        }
        if (loginData.rbacUserTokenRefresh) {
            createAutoRefreshRoutine();
        }
        return loginData;
    } else {
        throw res.body;
    }

    function createAutoRefreshRoutine() {
        const resolveIn = loginData.expiresIn - new Date(loginData.serverTime).getTime() - 300000;
        let intervalValue = (loginData.rbacUserTokenDuration - (5 * 60)) * 1000;
        if (loginData.bot) {
            intervalValue = (loginData.rbacBotTokenDuration - (5 * 60)) * 1000;
        }
        timer(resolveIn).pipe(
            flatMap(e => doRefresh())
        ).subscribe((res1) => {
            Object.assign(loginData, res1);
            interval(intervalValue).pipe(
                flatMap(e => doRefresh())
            ).subscribe((res2) => {
                Object.assign(loginData, res2);
            }, console.error);
        }, console.error);
    }
    function createHeartBeatRoutine() {
        const resolveIn = (loginData.rbacHbInterval * 1000) - 1000;
        doHeartbeat().subscribe(data => {
            interval(resolveIn).pipe(
                flatMap(e => doHeartbeat())
            ).subscribe((res2) => { }, console.error);
        }, console.error);

    }
    function doRefresh() {
        return new Observable(async (observe) => {
            let res = await httpClient.get(refreshUrl, {
                headers: {
                    rToken: loginData.rToken,
                    Authorization: loginData.token
                }
            });
            if (res.statusCode === 200) {
                Object.assign(loginData, res.body);
                observe.next(res.body);
            } else {
                observe.error(res.body);
            }
            observe.complete();
        });
    }
    function doHeartbeat() {
        return new Observable(async (observe) => {
            let res = await httpClient.put(heartBeatUrl, {
                headers: {
                    Authorization: loginData.token
                },
                body: {
                    uuid: loginData.uuid
                }
            });
            if (res.statusCode === 200) {
                Object.assign(loginData, res.body);
                observe.next(res.body);
            } else {
                observe.error(res.body);
            }
            observe.complete();
        });
    }
}




module.exports = login;