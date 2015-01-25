import 'traceur'
import fs from 'fs'

import {
  fileReadStream, fileWriteStream, tempFileReadStream,
  streamToFile, byteRangeFileStream,
  fileStreamable, tempFileStreamable, toFileStreamable
} from '../lib/file-stream'

import {
  streamToText, pipeStream
} from 'quiver-stream-util'

let {
  readFile, readFileSync
} = fs

import { promisify, resolve } from 'quiver-promise'

let chai = require('chai')
let chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)
let should = chai.should()

readFile = promisify(readFile)

let testFilePath = 'test/test-file.txt'
let testWritePath ='test/test-write.txt'
let testTempPath = 'test/test-temp.txt'

let expectedContent = readFileSync(testFilePath).toString()

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
    let start = 128
    let end = 512

    let expectedSlice = expectedContent.slice(start, end)
    
    return byteRangeFileStream(testFilePath, { start, end })
      .then(streamToText).should.eventually.equal(expectedSlice)
  })

  it('file streamable test', () => 
    fileStreamable(testFilePath).then(streamable => {
      should.exist(streamable.toStream)
      should.exist(streamable.toByteRangeStream)
      should.exist(streamable.toFilePath)

      streamable.toFilePath().should.eventually.equal(testFilePath)

      should.equal(streamable.reusable, true)
      should.equal(streamable.contentLength, expectedContent.length)
    }))

  it('temp file streamable test', () => {
    let getTempPath = () => resolve(testTempPath)

    return fileReadStream(testFilePath).then(readStream => {
      let streamable = {
        toStream: () => resolve(readStream)
      }

      return toFileStreamable(streamable, getTempPath)
      .then(streamable => {
        should.exist(streamable.toStream)
        should.exist(streamable.toByteRangeStream)
        should.exist(streamable.toFilePath)

        should.equal(streamable.reusable, false)
        should.equal(streamable.tempFile, true)
        should.equal(streamable.contentLength, expectedContent.length)

        streamable.toFilePath().should.eventually.equal(testTempPath)

        readFileSync(testTempPath).toString().should.equal(expectedContent)
      })
    })
  })

})