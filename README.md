# quick-grpc
A quick, simple gRPC loader / object maker

## Usage

```js
const QuickgRpc = require('quick-grpc')

async function go () {
  let MyLibrary = await new QuickgRpc({
    host: 'localhost:443',
    basePath: './protosDirectory'
  })

  console.log('MyLibrary:', MyLibrary)
}

go()
```
