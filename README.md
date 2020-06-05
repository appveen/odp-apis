# odp-apis

A Library to integrate ODP into any application.

## Examples

```javascript
const { Login } = require('odp-apis');

Login({
    host: HOST,
    username: USERNAME,
    password: PASSWORD
}).then(userData=>{
    console.log(userData.token);
}).catch(console.error);

```

### Features

- userData will contain the login data.
- Heartbeats and Token Refresh is internally handled for you.
- userData.token will always give you the latest valid token. 
