const { join } = require('path')
const grpc = require('grpc')
const protoLoader = require('@grpc/proto-loader')

const packageDefinition = protoLoader.loadSync(
  join(__dirname, 'test.proto'),
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  }
)

const testprotos = grpc.loadPackageDefinition(packageDefinition).testprotos

const server = new grpc.Server()

server.addService(testprotos.Test.service, {
  CoolTest: function (call, cb) {
    return cb(null, call.request)
  },
  CoolStream: function (call) {
    call.on('data', function (msgData) {
      call.write(msgData)
      call.end()
    })
  }
})

server.bind('0.0.0.0:9999', grpc.ServerCredentials.createInsecure())

server.start()

module.exports = server
