
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

var createByteRangeFileStream = function(filePath, start, end, callback) {
  fs.stats(filePath, function(err, stats) {
    if(err) return callback(error(500, 'error reading file', err))

    if(stats.size >= end) return callback(error(416, 'out of range'))
    var nodeReadStream = fs.createReadStream(filePath, {
      start: start,
      end: end
    })

    var readStream = nodeStream.createNodeReadStreamAdapter(nodeReadStream)

    return callback(null, readStream)
  })
}

var createFileWriteStream = function(filePath, callback) {
  var nodeWriteStream = fs.createWriteStream(filePath)
  var writeStream = nodeStream.createNodeWriteStreamAdapter(nodeWriteStream)

  return callback(null, writeStream)
}

var createFileStreamable = function(filePath, callback) {
  fs.exists(filePath, function(exist) {
    if(!exist) return callback(error(404, 'file not found'))

    fs.stats(filePath, function(err, stats) {
      if(err) return callback(error(500, 'error reading file', err))
      if(stats.isDirectory()) return callback(error(404, 
        'file path is a directory'))

      var streamable = {
        toStream: function(callback) {
          return createFileStreamable(filePath, callback)
        },
        toFilePath: function() {
          return filePath
        },
        toByteRangeStream: function(start, end, callback) {
          return createByteRangeFileStream(filePath, start, end, callback)
        }
      }

      callback(null, streamable)
    })
  })
}

var streamableToFilePath = function(streamable, tempPathGenerator, callback) {
  if(streamable.toFilePath) return callback(null, streamable.toFilePath())

  tempPathGenerator(function(err, tempPath) {
    if(err) return callback(err)

    streamable.toStream(function(err, readStream) {
      if(err) return callback(err)
        
      createFileWriteStream(tempPath, function(err, writeStream) {
        if(err) return callback(err)

        pipeStream(readStream, writeStream, function(err) {
          if(err) return callback(err)

          callback(null, tempPath)
        })
      })
    })
  })
}

module.exports = {
  createFileReadStream: createFileReadStream,
  createFileWriteStream: createFileWriteStream,
  createFileStreamable: createFileStreamable,
  streamableToFilePath: streamableToFilePath
}
