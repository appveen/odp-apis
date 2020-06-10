# odp-apis

A Library to integrate ODP into any application.

## Examples

```javascript
const ODP = require('odp-apis');

const API = new ODP({
    host: HOST,
    username: USERNAME,
    password: PASSWORD
});
API.login().then(())=>{
    console.log(API.loginData);
}).catch(console.error);

```

### Features

- API.loginData will contain the login data.
- Heartbeats and Token Refresh is internally handled.
- API.loginData.token will always give you the latest valid token. 
