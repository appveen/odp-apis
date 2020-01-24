# odp-apis

A Library to integrate ODP into any application.

## Examples

```javascript
const ODP = require('odp-apis');

const api = ODP.api({
    host: HOST,
    username: USERNAME,
    password: PASSWORD
});


api.login().then(data => {
    console.log(data.body); //Login Data
}).catch(err => {
    console.log(err);
});



api.app('ODP').get().then(data => {
    console.log(data.body); //App Data
}).catch(err => {
    console.log(err);
});



api.app('ODP').dataService('Defects').get().then(data=>{
    console.log(data); // Defects Data Service Document
}).catch(err=>{
    console.log(err);
});



api.app('ODP').dataService('Defects').documents().list({
    count: 30,
    select: '_id,summary,status'
}).then(data => {
    console.log(data.body); // Records of Defects Data Service
}).catch(err => {
    console.log(err);
});
```
