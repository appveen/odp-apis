const request = require('request');

const e = {};

e.get = (url, options) => {
    return new Promise((resolve, reject) => {
        if (!options) {
            options = {};
        }
        options.json = true;
        request.get(url, options, (err, res, body) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    })
}

e.put = (url, options) => {
    return new Promise((resolve, reject) => {
        if (!options) {
            options = {};
        }
        options.json = true;
        request.put(url, options, (err, res, body) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    })
}


e.post = (url, options) => {
    return new Promise((resolve, reject) => {
        if (!options) {
            options = {};
        }
        options.json = true;
        request.post(url, options, (err, res, body) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    })
}


e.delete = (url, options) => {
    return new Promise((resolve, reject) => {
        if (!options) {
            options = {};
        }
        options.json = true;
        request.delete(url, options, (err, res, body) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    })
}

module.exports = e;