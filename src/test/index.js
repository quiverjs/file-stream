import test from 'tape'

import { readFileSync, readFile as readFileAsync } from 'fs'

import { asyncTest } from 'quiver-util/tape'
import { promisify, resolve } from 'quiver-util/promise'
import { streamToText, pipeStream } from 'quiver-stream-util'

import {
  fileReadStream, fileWriteStream, byteRangeFileStream,
  fileStreamable, toFileStreamable
} from '../lib'

const readFile = promisify(readFileAsync)

const testFilePath = 'fixture/test-file.txt'
const testWritePath ='fixture/test-write.txt'
const testTempPath = 'fixture/test-temp.txt'

const expectedContent = readFileSync(testFilePath).toString()

test('file stream test', assert => {
  assert::asyncTest('file read stream test', async function(assert) {
    const readStream = await fileReadStream(testFilePath)
    const text = await streamToText(readStream)
    assert.equal(text, expectedContent)

    assert.end()
  })

  assert::asyncTest('file write stream test', async function(assert) {
    const readStream = await fileReadStream(testFilePath)
    const writeStream = await fileWriteStream(testWritePath)
    await pipeStream(readStream, writeStream)
    const buffer = await readFile(testWritePath)
    assert.equal(buffer.toString(), expectedContent)

    assert.end()
  })

  assert::asyncTest('file byte range stream test', async function(assert) {
    const start = 128
    const end = 512

    const expectedSlice = expectedContent.slice(start, end)

    const stream = await byteRangeFileStream(testFilePath, { start, end })
    const text = await streamToText(stream)
    assert.equal(text, expectedSlice)

    assert.end()
  })

  assert::asyncTest('file streamable test', async function(assert) {
    const streamable = await fileStreamable(testFilePath)
    assert.ok(streamable.toStream)
    assert.ok(streamable.toByteRangeStream)
    assert.ok(streamable.toFilePath)

    assert.equal(await streamable.toFilePath(), testFilePath)

    assert.equal(streamable.reusable, true)
    assert.equal(streamable.contentLength, expectedContent.length)

    assert.end()
  })

  assert::asyncTest('temp file streamable test', async function(assert) {
    const getTempPath = () => resolve(testTempPath)
    const readStream = await fileReadStream(testFilePath)

    const originalStreamable = {
      toStream: () => resolve(readStream)
    }

    const streamable = await toFileStreamable(originalStreamable, getTempPath)
    assert.ok(streamable.toStream)
    assert.ok(streamable.toByteRangeStream)
    assert.ok(streamable.toFilePath)

    assert.equal(streamable.reusable, false)
    assert.equal(streamable.tempFile, true)
    assert.equal(streamable.contentLength, expectedContent.length)

    assert.equal(await streamable.toFilePath(), testTempPath)
    const buffer = await readFile(testTempPath)
    assert.equal(buffer.toString(), expectedContent)

    assert.end()
  })
})
