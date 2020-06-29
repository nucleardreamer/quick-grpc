const { join } = require('path')
const test = require('tape')
const _ = require('lodash')
const QuickgRpc = require(join(__dirname, '..'))
const server = require(join(__dirname, 'server'))

test('testing quick-grpc module', async t => {
  t.plan(13)

  t.comment('constructing quick-grpc client')
  let client = await new QuickgRpc({
    host: '0.0.0.0:9999',
    basePath: __dirname
  })

  t.assert(_.isObject(client), 'constructor returns an object')
  t.assert(_.has(client, 'test'), 'has `test` method')
  t.assert(_.has(client, 'testCamelCase'), 'has `testCamelCase` method')

  t.comment('test camelCaseMethods: false')
  let clientNoCamelCaseMethods = await new QuickgRpc({
    host: '0.0.0.0:9999',
    basePath: __dirname,
    camelCaseMethods: false
  })
  t.assert(_.has(clientNoCamelCaseMethods, 'Test'), 'has `Test` method without camelCaseNames')
  t.assert(_.has(clientNoCamelCaseMethods, 'TestCamel_Case'), 'has `TestCamel_Case` method without camelCaseNames')

  t.comment('test defintions')
  t.assert(_.has(client, 'test.definition'), 'client.test has a defintion object')
  let clientDef = client.test.definition
  t.assert(_.has(clientDef, 'CoolTest.path'), 'test has CoolTest defintion')
  t.assert(_.has(clientDef, 'CoolStream.path'), 'test has CoolStream defintion')

  t.comment('test connection')
  let clientCon = await client.test()
  t.assert(_.has(clientCon.__proto__, 'CoolTest'), 'test has CoolTest method')
  t.assert(_.has(clientCon.__proto__, 'CoolStream'), 'test has CoolStream method')

  let msgPayload = { msg: 'a-ok' }

  clientCon.CoolTest(msgPayload, function (err, msg) {
    t.comment('test.CoolTest method')
    t.assert(_.isNull(err), 'CoolTest callback error is null')
    t.assert(_.isEqual(msg, msgPayload), 'CoolTest sent back the same message it received')
  })

  t.comment('test.CoolStream method')
  let coolStream = clientCon.CoolStream()
  coolStream.on('data', function (msg) {
    t.assert(_.isEqual(msg, msgPayload), 'CoolStream sent back the same message it received')
  })
  coolStream.write(msgPayload)
})

test.onFinish(() => server.tryShutdown(() => {}))
