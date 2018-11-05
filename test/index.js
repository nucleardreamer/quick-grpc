const { join } = require('path')
const test = require('tape')
const _ = require('lodash')
const QuickgRpc = require(join(__dirname, '..'))
const server = require(join(__dirname, 'server'))

test('testing quick-grpc module', async t => {
  t.plan(8)
  t.comment('* constructing quick-grpc client')

  let client = await new QuickgRpc({
    host: '0.0.0.0:9999',
    basePath: __dirname
  })

  t.assert(_.isObject(client), 'constructor returns an object')
  t.assert(_.has(client, 'test'), 'has `test` method')
  t.assert(_.has(client, 'testCamelCase'), 'has `testCamelCase` method')

  t.comment('* connecting to `test` service')
  let clientTest = await client.test()
  t.assert(_.has(clientTest.__proto__, 'CoolTest'), 'test has CoolTest method')
  t.assert(_.has(clientTest.__proto__, 'CoolStream'), 'test has CoolStream method')

  let msgPayload = { msg: 'a-ok' }

  t.comment('* test.CoolStream')
  let coolStream = clientTest.CoolStream()
  coolStream.on('data', function (msg) {
    t.assert(_.isEqual(msg, msgPayload), 'CoolStream sent back the same message it received')
  })
  coolStream.write(msgPayload)

  t.comment('* test.CoolTest')
  clientTest.CoolTest(msgPayload, function (err, msg) {
    t.assert(_.isNull(err), 'CoolTest callback error is null')
    t.assert(_.isEqual(msg, msgPayload), 'CoolTest sent back the same message it received')
  })
})

test.onFinish(() => server.tryShutdown(() => {}))
