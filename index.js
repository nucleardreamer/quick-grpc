const { join } = require('path')
const { readdir } = require('fs')
const { promisify } = require('util')
const protoLoader = require('@grpc/proto-loader')
const grpc = require('grpc')

const _ = require('lodash')
const readdirAsync = promisify(readdir)

class QuickgRPC {
  constructor ({ host = 'localhost:443', credentials = false, basePath = __dirname, camelCaseMethods = true, protoLoaderOptions = {} }) {
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
          join(basePath, protoPath),
          protoLoaderOptions
        )

        _.forEach(_.keys(protoDef), (protoStringPath) => {
          // storing the original constructor
          let ProtoConstructor = _.get(protoObj, protoStringPath)
          // grabbing the string representation (camelCased) of the constructor
          let protoName = _(protoStringPath).chain()
            .split('.')
            .last()
            .value()

          if (camelCaseMethods) protoName = _.camelCase(protoName)

          result[protoName] = async function connect ({ host = false, credentials = false } = {}) {
            return new ProtoConstructor(
              (host || defaultHost),
              (credentials ? makeCredentials(credentials) : defaultCredentials)
            )
          }
          result[protoName].definition = _.get(protoDef, protoStringPath)
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

async function getProtoObject (protoPath, userOptions) {
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
    options = _.defaults(userOptions, options)
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
