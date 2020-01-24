const log4js = require('log4js');
const router = require('express').Router();

const httpClient = require('./lib/http-client.utils');

let HOST;

const apiMap = {};
const logger = log4js.getLogger('odp.middleware');

/**
 * 
 * @typedef {Object} MiddlewareOptions
 * @property {string} host - The hostname/FQDN of the application to connect
 */

/**
* 
* @typedef {Object} LoginOptions
* @property {string} username - Username of Bot
* @property {string} password - Password of Bot
*/

/**
 * 
 * @param {MiddlewareOptions} options
 */
function middleware(options) {
    HOST = options.host;
    router.get('/odp/login', (req, res) => {
        const body = req.body;
        if (!body.username || !body.password) {
            res.status(400).json({
                message: 'Invalid Username/Password'
            });
            return;
        }
        doLogin(body.username, body.password).then(data => {
            res.status(data.statusCode).json(data.body);
            createApiMap().then(mapRes => {
                if (mapRes.statusCode === 200) {
                    logger.info('API Map Created!');
                } else {
                    logger.info('API Map Creation Failed!');
                    logger.debug(mapRes.statusCode, JSON.stringify(mapRes.body));
                }
            }).catch(err => {
                logger.error(err);
            })
        }).catch(err => {
            logger.error(err);
            res.status(500).json({
                message: err.message
            });
        });
    });
    router.get('/odp/documents/:serviceId', (req, res) => {
        const body = req.body;
        if (!body.username || !body.password) {
            res.status(400).json({
                message: 'Invalid Username/Password'
            });
            return;
        }
        doLogin(req, res).then(data => {
            res.status(data.statusCode).json(data.body);
        }).catch(err => {
            res.status(500).json({
                message: err.message
            });
        });
    });
    return router;
}


/**
 * 
 * @param {string} username Username of bot
 * @param {string} password Password of bot
 */
function doLogin(username, password) {
    async function execute() {
        const res = await httpClient.post(HOST + '/api/a/rbac/login', {
            body: { username, password }
        });
        return res;
    }
    return execute();
}


/**
 * 
 * @param {string} token Authorization Token
 */
function createApiMap(token) {
    async function execute() {
        const res = await httpClient.get(HOST + '/api/a/sm/service', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'JWT ' + token
            },
            qs: {
                count: -1,
                select: '_id,api,app'
            }
        });
        if (res.statusCode === 200 && Array.isArray(res.body)) {
            res.body.forEach(item => {
                apiMap[item._id] = '/api/c/' + item.app + item.api;
            });
        }
        return res;
    }
    return execute();
}

module.exports = middleware;