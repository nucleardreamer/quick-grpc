const { join } = require('path')
const { readdir } = require('fs')
const { promisify } = require('util')
const protoLoader = require('@grpc/proto-loader')
const grpc = require('grpc')

const _ = require('lodash')
const readdirAsync = promisify(readdir)

class QuickgRPC {
  constructor ({ host = 'localhost:443', credentials = false, basePath = __dirname }) {
    // create default host address
    let defaultHost = host
    // create default credentials
    let defaultCredentials = makeCredentials(credentials)

    // wrapping up async instance, you cannot have a class constructor instatiated as an async function
    return (async () => {
      let protoFiles = await getProtoFiles(basePath)

      // reduce the proto definition paths to single non-nested objects
      let res = await Promise.all(protoFiles.map(async protoPath => {
        // store the final object
        let result = {}

        // get the constructed proto, and its original definiton
        let { protoObj, protoDef } = await getProtoObject(
          join(basePath, protoPath)
        )

        _.forEach(_.keys(protoDef), (protoStringPath, protoDefObj) => {
          // storing the original constructor
          let ProtoConstructor = _.get(protoObj, protoStringPath)
          // grabbing the string representation (camelCased) of the constructor
          let protoName = _(protoStringPath).chain()
            .split('.')
            .last()
            .camelCase()
            .value()

          // store the original defintion as a point of reference, might be redundant
          _.assign(ProtoConstructor, {
            _definition: _.get(protoDef, protoDefObj)
          })

          result[protoName] = async function ({ host = false, credentials = false } = {}) {
            // wrapping up the proto method names into a simple construction, in order to apply defaults
            let con = await new ProtoConstructor(
              (host || defaultHost),
              (credentials ? makeCredentials(credentials) : defaultCredentials)
            )
            return con
          }
        })

        return result
      }))
      // merge all into one object
      return _.assign({}, ...res)
    })()
  }
}

function makeCredentials ({ root, priv, chain } = {}) {
  // we create insecure credentials if we have any specified
  return (root && priv && chain) ? grpc.credentials.createSsl(root, priv, chain) : grpc.credentials.createInsecure()
}

async function getProtoFiles (PROTOS_BASE) {
  try {
    let protoFiles = await readdirAsync(PROTOS_BASE)
    return _.filter(protoFiles, file => file.indexOf('.proto') !== -1)
  } catch (e) {
    throw new Error(`The protobuf resource directory does not exist: ${PROTOS_BASE}`)
  }
}

async function getProtoObject (protoPath) {
  if (!protoPath) throw new Error('No proto definition specified')
  return new Promise((resolve, reject) => {
    // these options get us close to what grpc.load had in previous versions
    let options = {
      keepCase: false,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    }
    // load up the proto
    protoLoader
      .load(protoPath, options)
      .then(protoDef => {
        const protoObj = grpc.loadPackageDefinition(protoDef)
        resolve({ protoObj, protoDef })
      })
      .catch(reject)
  })
}

module.exports = QuickgRPC
