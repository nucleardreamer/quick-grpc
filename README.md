# quick-grpc
A quick, simple gRPC loader / object maker. This module is nothing more than bubblewrap around loading and instanciating one or more `.proto` files in a directory. 

## Installation
`npm install quick-grpc`

## Example usage

```js
const QuickgRpc = require('quick-grpc')
const { readFileSync } = require('fs')

async function go () {
  let MyLibrary = await new QuickgRpc({
    host: 'localhost:443',
    // optional credential files, otherwise it will assign grpc.credentials.createInsecure()
    credentials: {
      root: readFileSync('ca-cert.pem'),
      priv: readFileSync('example.key'),
      chain: readFileSync('example.cert')
    },
    basePath: './protosDirectory'
  })

  console.log('MyLibrary:', MyLibrary)
}

go()
```
