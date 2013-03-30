
var fs = require('fs')
var path = require('path')
var should = require('should')
var fileStream = require('../lib/file-stream')
var pipeStream = require('quiver-pipe-stream').pipeStream

var testFile = path.join(__dirname, '../lib/file-stream.js')
var testWritePath = path.join(__dirname, './test-write-result')

var nodeStreamToText = function(readStream, callback) {
  var buffer = ''

  readStream.on('data', function(data) {
    buffer += data
  })
  readStream.on('end', function() {
    callback(buffer)
  })
  readStream.on('error', function(err) {
    throw err
  })
}

var getOriginalContent = function(callback) {
  nodeStreamToText(fs.createReadStream(testFile), callback)
}

var quiverStreamToText = function(readStream, callback) {
  var buffer = ''

  var doPipe = function() {
    readStream.read(function(streamClosed, data) {
      if(streamClosed) return callback(streamClosed.err, buffer)

      buffer += data
      doPipe()
    })
  }

  doPipe()
}

describe('basic test of file read stream', function() {
  it('should read the same content', function(callback) {
    getOriginalContent(function(originalContent) {
      fileStream.createFileReadStream(testFile, function(err, readStream) {
        if(err) throw err

        quiverStreamToText(readStream, function(err, content) {
          if(err) throw err

          content.should.equal(originalContent)
          callback(null)
        })
      })
    })
  })
})

describe('basic test of file write stream', function() {
  it('should write the same content successfully', function(callback) {
    fileStream.createFileReadStream(testFile, function(err, readStream) {
      if(err) throw err

      fileStream.createFileWriteStream(testWritePath, function(err, writeStream) {
        if(err) throw err

        pipeStream(readStream, writeStream, callback)
      })
    })
  })
})