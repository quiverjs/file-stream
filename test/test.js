import 'traceur'

import {
  fileReadStream, fileWriteStream, tempFileReadStream,
  streamToFile, byteRangeFileStream,
  fileStreamable, tempFileStreamable, toFileStreamable
} from '../lib/file-stream.js'

import {
  streamToText, pipeStream
} from 'quiver-stream-util'

import {
  readFile, readFileSync
} from 'fs'

import { promisify, resolve } from 'quiver-promise'

var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)
var should = chai.should()

readFile = promisify(readFile)

var testFilePath = 'test/test-file.txt'
var testWritePath ='test/test-write.txt'
var testTempPath = 'test/test-temp.txt'

var expectedContent = readFileSync(testFilePath).toString()

describe('file stream test', () => {
  it('file read stream test', () =>
    fileReadStream(testFilePath).then(streamToText)
      .should.eventually.equal(expectedContent))

  it('file write stream test', () =>
    Promise.all([
      fileReadStream(testFilePath), 
      fileWriteStream(testWritePath)
    ]).then(([readStream, writeStream]) =>
      pipeStream(readStream, writeStream).then(() => {
        readFileSync(testWritePath).toString()
          .should.equal(expectedContent)
      })))

  it('file byte range stream test', () => {
    var start = 128
    var end = 512

    var expectedSlice = expectedContent.slice(start, end)
    
    return byteRangeFileStream(testFilePath, { start, end })
      .then(streamToText).should.eventually.equal(expectedSlice)
  })

  it('file streamable test', () => 
    fileStreamable(testFilePath).then(streamable => {
      should.exist(streamable.toStream)
      should.exist(streamable.toByteRangeStream)
      should.exist(streamable.toFilePath)

      should.equal(streamable.reusable, true)
      should.equal(streamable.toFilePath(), testFilePath)
      should.equal(streamable.contentLength, expectedContent.length)
    }))

  it('temp file streamable test', () => {
    var getTempPath = () => resolve(testTempPath)

    fileReadStream(testFilePath).then(readStream => {
      var streamable = {
        toStream: () => resolve(readStream)
      }

      return toFileStreamable(streamable, getTempPath)
      .then(streamable => {
        should.exist(streamable.toStream)
        should.exist(streamable.toByteRangeStream)
        should.exist(streamable.toFilePath)

        should.equal(streamable.reusable, false)
        should.equal(streamable.tempFile, true)
        should.equal(streamable.toFilePath(), testTempPath)
        should.equal(streamable.contentLength, expectedContent.length)
      })
    })
  })

})