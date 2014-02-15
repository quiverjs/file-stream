
'use strict'

var fs = require('fs')
var error = require('quiver-error').error
var nodeStream = require('quiver-node-stream')
var pipeStream = require('quiver-pipe-stream').pipeStream

var createFileWriteStream = function(filePath, callback) {
  var nodeWriteStream = fs.createWriteStream(filePath)
  var writeStream = nodeStream.createNodeWriteStreamAdapter(nodeWriteStream)

  return callback(null, writeStream)
}

var createFileReadStream = function(filePath, callback) {
  var nodeReadStream = fs.createReadStream(filePath)
  var readStream = nodeStream.createNodeReadStreamAdapter(nodeReadStream)

  return callback(null, readStream)
}

var streamToFile = function(readStream, filePath, callback) {
  createFileWriteStream(filePath, function(err, writeStream) {
    if(err) return callback(err)

    pipeStream(readStream, writeStream, callback)
  })
}

var createByteRangeFileStreamWithStats = function(filePath, fileStats, start, end, callback) {
  if(fileStats.size < end) return callback(error(416, 'out of range'))

  var nodeReadStream = fs.createReadStream(filePath, {
    start: start,
    end: end-1
  })

  var readStream = nodeStream.createNodeReadStreamAdapter(nodeReadStream)

  return callback(null, readStream)
}

var createByteRangeFileStream = function(filePath, start, end, callback) {
  fs.stat(filePath, function(err, fileStats) {
    if(err) return callback(error(500, 'error reading file', err))

    createByteRangeFileStreamWithStats(filePath, fileStats, start, end, callback)
  })
}

var createFileStreamableWithStats = function(filePath, fileStats) {
  var streamable = {
    toStream: function(callback) {
      return createFileReadStream(filePath, callback)
    },
    toByteRangeStream: function(start, end, callback) {
      return createByteRangeFileStream(filePath, start, end, callback)
    },
    toFilePath: function() {
      return filePath
    },
    reusable: true,
    contentLength: fileStats.size,
    lastModified: fileStats.mtime
  }

  return streamable
}

var createFileStreamable = function(filePath, callback) {
  fs.stat(filePath, function(err, fileStats) {
    if(err) return callback(error(500, 'error reading file', err))
    if(fileStats.isDirectory()) return callback(error(404, 
      'file path is a directory'))

    var streamable = createFileStreamableWithStats(filePath, fileStats)

    callback(null, streamable)
  })
}

var streamableToFilePath = function(streamable, tempPathGenerator, callback) {
  if(streamable.toFilePath) return callback(null, streamable.toFilePath())

  tempPathGenerator(function(err, tempPath) {
    if(err) return callback(err)

    streamable.toStream(function(err, readStream) {
      if(err) return callback(err)
        
      streamToFile(readStream, tempPath, function(err) {
        if(err) return callback(err)

        callback(null, tempPath)
      })
    })
  })
}

module.exports = {
  createFileWriteStream: createFileWriteStream,
  createFileReadStream: createFileReadStream,
  streamToFile: streamToFile,
  createByteRangeFileStream: createByteRangeFileStream,
  createByteRangeFileStreamWithStats: createByteRangeFileStreamWithStats,
  createFileStreamableWithStats: createFileStreamableWithStats,
  createFileStreamable: createFileStreamable,
  streamableToFilePath: streamableToFilePath
}
