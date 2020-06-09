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
API.login().then(userData=>{
    console.log(userData.token);
}).catch(console.error);

```

### Features

- userData will contain the login data.
- Heartbeats and Token Refresh is internally handled for you.
- userData.token will always give you the latest valid token. 
