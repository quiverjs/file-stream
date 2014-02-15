
'use strict'

var fs = require('fs')
var path = require('path')
var should = require('should')
var pipeStream = require('quiver-pipe-stream').pipeStream
var streamConvert = require('quiver-stream-convert')

var fileStreamLib = require('../lib/file-stream')

var testFilePath = path.join(__dirname, 'test-file.txt')
var testWritePath = path.join(__dirname, 'test-write.txt')
var testTempPath = path.join(__dirname, 'test-temp.txt')

var getOriginalContent = function(callback) {
  fs.readFile(testFilePath, { encoding: 'utf8' }, callback)
}

describe('file stream test', function() {
  it('file read stream test', function(callback) {
    getOriginalContent(function(err, originalContent) {
      if(err) return callback(err)

      fileStreamLib.createFileReadStream(testFilePath, function(err, readStream) {
        if(err) throw err

        streamConvert.streamToText(readStream, function(err, content) {
          if(err) throw err

          should.equal(content, originalContent)
          callback(null)
        })
      })
    })
  })

  it('file write stream test', function(callback) {
    fileStreamLib.createFileReadStream(testFilePath, function(err, readStream) {
      if(err) throw err

      fileStreamLib.createFileWriteStream(testWritePath, function(err, writeStream) {
        if(err) throw err

        pipeStream(readStream, writeStream, callback)
      })
    })
  })

  it('file byte stream test', function(callback) {
    getOriginalContent(function(err, originalContent) {
      if(err) return callback(err)

      var start = 8
      var end = 32

      var originalSlice = originalContent.slice(start, end)

      fileStreamLib.createByteRangeFileStream(testFilePath, start, end, 
        function(err, readStream) {
          if(err) return callback(err)

          streamConvert.streamToText(readStream, function(err, content) {
            if(err) return callback(err)

            should.equal(content, originalSlice)
            callback(null)
          })
        })
    })
  })

  it('file streamable test', function(callback) {
    getOriginalContent(function(err, originalContent) {
      if(err) return callback(err)

      var fileSize = originalContent.length

      var start = 16
      var end = 64

      var originalSlice = originalContent.slice(start, end)

      fileStreamLib.createFileStreamable(testFilePath, function(err, streamable) {
        if(err) return callback(err)

        should.exists(streamable.toStream)
        should.exists(streamable.toByteRangeStream)
        should.exists(streamable.toFilePath)

        should.equal(streamable.reusable, true)
        should.equal(streamable.toFilePath(), testFilePath)
        should.equal(streamable.contentLength, fileSize)

        callback()
      })
    })
  })

  it('streamable to file path test', function(callback) {
    getOriginalContent(function(err, originalContent) {
      if(err) return callback(err)

      var tempGen = function(callback) {
        callback(null, testTempPath)
      }

      fileStreamLib.createFileReadStream(testFilePath, function(err, readStream) {
        if(err) return callback(err)

        var streamable = {
          toStream: function(callback) {
            callback(null, readStream)
          }
        }

        fileStreamLib.streamableToFilePath(streamable, tempGen, function(err, filePath) {
          if(err) return callback(err)

          should.equal(filePath, testTempPath)
          fs.readFile(testTempPath, { encoding: 'utf8' }, function(err, tempContent) {
            if(err) return callback(err)

            should.equal(tempContent, originalContent)
            callback()
          })
        })
      })
    })
  })
})