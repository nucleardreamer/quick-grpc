const { join } = require('path')
const QuickgRpc = require(join(__dirname, '..'))

async function go () {
  let allTests = await new QuickgRpc({
    host: 'localhost:443',
    basePath: __dirname
  })

  console.log('TEST:', allTests)
}

go()
