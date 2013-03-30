
var fs = require('fs')
var error = require('quiver-error').error
var nodeStream = require('quiver-node-stream')

var createFileReadStream = function(filePath, callback) {
  fs.exists(filePath, function(exist) {
    if(!exist) return callback(error(404, 'file not found'))

    var nodeReadStream = fs.createReadStream(filePath)

    var readStream = nodeStream.createNodeReadStreamAdapter(nodeReadStream)

    return callback(null, readStream)
  })
}

var createFileWriteStream = function(filePath, callback) {
  var nodeWriteStream = fs.createWriteStream(filePath)
  var writeStream = nodeStream.createNodeWriteStreamAdapter(nodeWriteStream)

  return callback(null, writeStream)
}

module.exports = {
  createFileReadStream: createFileReadStream,
  createFileWriteStream: createFileWriteStream
}
